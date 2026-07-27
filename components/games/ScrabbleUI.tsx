import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import * as Haptics from "expo-haptics";
import { colyseusService } from "../../store/colyseusService";
import { useGameData } from "./useGameData";
import { RootState } from "../../store/store";

type TileState = { id: number; char: string; placedIndex: number | null };

export function ScrabbleUI() {
  const { timer, myPlayer, sendAction, isPractice } = useGameData();
  const room = isPractice ? colyseusService.practiceRoom : colyseusService.room;
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const [gameData, setGameData] = useState<any>(null);
  const [tiles, setTiles] = useState<TileState[]>([]);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const pointsAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [pointsText, setPointsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitPressed, setIsSubmitPressed] = useState(false);

  const [pressedRackId, setPressedRackId] = useState<number | null>(null);
  const [pressedSlotIdx, setPressedSlotIdx] = useState<number | null>(null);

  const triggerShake = React.useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 12,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -12,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Clear board after shake
      setTiles((prev) => prev.map((t) => ({ ...t, placedIndex: null })));
    });
  }, [shakeAnim]);

  // Parse game state
  useEffect(() => {
    if (myPlayer?.gameData) {
      try {
        const parsed = JSON.parse(myPlayer.gameData);
        setGameData(parsed);

        // Initialize tiles if not already done
        if (tiles.length === 0 && parsed.letters) {
          setTiles(
            parsed.letters.map((char: string, i: number) => ({
              id: i,
              char,
              placedIndex: null,
            })),
          );
        }
      } catch (e) {}
    }
  }, [myPlayer?.gameData, tiles.length]);

  // Listen for feedback messages
  useEffect(() => {
    if (!room) return;

    // We must define a stable reference for the handler
    const handleFeedback = (message: any) => {
      setIsSubmitting(false);

      if (message.isValid) {
        setFeedback({
          text: `+${message.word.length} POINTS!`,
          type: "success",
        });

        setPointsText(`+${message.word.length}`);
        pointsAnim.setValue(0);
        Animated.sequence([
          Animated.timing(pointsAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(600),
          Animated.timing(pointsAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // Clear board after successful submit
        setTiles((prev) => prev.map((t) => ({ ...t, placedIndex: null })));
      } else if (message.isDuplicate) {
        setFeedback({ text: "ALREADY FOUND!", type: "info" });
        triggerShake();
      } else {
        setFeedback({ text: "INVALID WORD!", type: "error" });
        triggerShake();
      }
      setTimeout(() => setFeedback(null), 1500);
    };

    // Attach listener
    const cleanup = room.onMessage("word_feedback", handleFeedback);

    // Cleanup is critical in React Native to prevent stale closures
    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [room, pointsAnim, triggerShake]);

  const handleTapRack = (tileId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTiles((prev) => {
      const copy = [...prev];
      const tile = copy.find((t) => t.id === tileId);
      if (!tile || tile.placedIndex !== null) return prev;

      // Find first empty slot
      const usedSlots = new Set(
        copy.map((t) => t.placedIndex).filter((i) => i !== null),
      );
      let firstEmpty = 0;
      while (usedSlots.has(firstEmpty) && firstEmpty < 5) firstEmpty++;

      if (firstEmpty < 5) tile.placedIndex = firstEmpty;
      return copy;
    });
  };

  const handleTapSlot = (placedIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTiles((prev) => {
      const copy = [...prev];
      const tile = copy.find((t) => t.placedIndex === placedIndex);
      if (tile) tile.placedIndex = null;
      return copy;
    });
  };

  const submitWord = () => {
    if (isSubmitting) return;

    // Reconstruct word based on placedIndex (0 to 4)
    const placedTiles = tiles
      .filter((t) => t.placedIndex !== null)
      .sort((a, b) => a.placedIndex! - b.placedIndex!);
    const word = placedTiles.map((t) => t.char).join("");

    if (word.length < 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback({ text: "TOO SHORT!", type: "error" });
      triggerShake();
      setTimeout(() => setFeedback(null), 1500);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    sendAction({ action: "submit_word", word });

    // Safety timeout to prevent permanent UI lock in case of network loss
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  const clearBoard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTiles((prev) => prev.map((t) => ({ ...t, placedIndex: null })));
  };

  const shuffleRack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTiles((prev) => {
      const rackTiles = prev.filter((t) => t.placedIndex === null);
      const placedTiles = prev.filter((t) => t.placedIndex !== null);

      // Shuffle rack tiles
      for (let i = rackTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rackTiles[i], rackTiles[j]] = [rackTiles[j], rackTiles[i]];
      }
      return [...placedTiles, ...rackTiles];
    });
  };

  if (!gameData) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? "bg-zinc-950" : "bg-green-500"}`}>
        <Text className={`font-black text-2xl uppercase tracking-widest ${isDark ? "text-white" : "text-black"}`}>
          LOADING SCRABBLE...
        </Text>
      </View>
    );
  }

  const placedTilesList = [0, 1, 2, 3, 4].map((idx) =>
    tiles.find((t) => t.placedIndex === idx),
  );
  const rackTiles = tiles.filter((t) => t.placedIndex === null);

  const getFeedbackBgColor = () => {
    if (!feedback) return "bg-blue-500";
    if (feedback.type === "success") return "bg-emerald-400";
    if (feedback.type === "error") return "bg-red-400";
    return "bg-cyan-400";
  };

  return (
    <View className={`flex-1 items-center justify-between w-full px-6 py-8 ${isDark ? "bg-zinc-950" : "bg-green-500"}`}>
      {/* HUD Header */}
      <View className="items-center w-full relative">
        <View style={styles.hudWrapper}>
          {/* Shadow */}
          <View
            style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            className={isDark ? "bg-white" : "bg-black"}
          />
          {/* Face */}
          <View
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
              borderWidth: 3,
              borderColor: isDark ? "#ffffff" : "#000000",
              alignItems: "center",
              justifyContent: "center",
              transform: [{ translateY: -3 }, { translateX: -3 }]
            }}
            className={isDark ? "bg-yellow-600" : "bg-yellow-300"}
          >
            <Text className="text-black font-black text-xs uppercase tracking-widest">
              SCORE
            </Text>
            <Text className="text-black font-black text-2xl">
              {myPlayer?.gameScore || 0}
            </Text>

            <Animated.Text
              style={{
                position: "absolute",
                top: -10,
                right: -25,
                opacity: pointsAnim,
                transform: [
                  {
                    translateY: pointsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, -20],
                    }),
                  },
                ],
              }}
              className="text-green-500 font-black text-2xl"
            >
              {pointsText}
            </Animated.Text>
          </View>
        </View>

        {/* Floating Feedback Card */}
        {feedback && (
          <View style={styles.feedbackWrapper}>
            {/* Shadow */}
            <View
              style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
              className={isDark ? "bg-white" : "bg-black"}
            />
            {/* Face */}
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 20,
                borderWidth: 3,
                borderColor: isDark ? "#ffffff" : "#000000",
                justifyContent: "center",
                alignItems: "center",
                transform: [{ translateY: -3 }, { translateX: -3 }]
              }}
              className={getFeedbackBgColor()}
            >
              <Text className="text-black font-black text-lg uppercase tracking-wider">
                {feedback.text}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Play Area */}
      <View className="w-full items-center mb-4">
        {/* Word Slots */}
        <Animated.View
          style={{ transform: [{ translateX: shakeAnim }] }}
          className="flex-row gap-2 mb-12 justify-center w-full"
        >
          {[0, 1, 2, 3, 4].map((slotIdx) => {
            const tile = placedTilesList[slotIdx];
            const isThisPressed = pressedSlotIdx === slotIdx;
            const translateOffset = tile && !isThisPressed ? -4 : 0;

            return (
              <View key={`slot-${slotIdx}`} style={styles.tileWrapper}>
                {tile ? (
                  <>
                    {/* Shadow */}
                    <View
                      style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                      className={isDark ? "bg-white" : "bg-black"}
                    />
                    {/* Tile Face */}
                    <TouchableOpacity
                      activeOpacity={1}
                      onPressIn={() => setPressedSlotIdx(slotIdx)}
                      onPressOut={() => setPressedSlotIdx(null)}
                      onPress={() => handleTapSlot(slotIdx)}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 16,
                        borderWidth: 3,
                        borderColor: isDark ? "#ffffff" : "#000000",
                        justifyContent: "center",
                        alignItems: "center",
                        transform: [
                          { translateY: translateOffset },
                          { translateX: translateOffset }
                        ]
                      }}
                      className="bg-amber-100"
                    >
                      <Text className="text-amber-900 font-black text-3xl">
                        {tile.char}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 16,
                      borderWidth: 3,
                      borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                      borderStyle: "dashed",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    className={isDark ? "bg-zinc-900" : "bg-black/10"}
                  />
                )}
              </View>
            );
          })}
        </Animated.View>

        {/* Action Buttons */}
        <View className="flex-row gap-4 mb-10 justify-center w-full">
          {/* CLEAR */}
          <View style={styles.actionBtnWrapper}>
            {/* Shadow */}
            <View
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
              className={isDark ? "bg-white" : "bg-black"}
            />
            {/* Body */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={clearBoard}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 16,
                borderWidth: 3,
                borderColor: isDark ? "#ffffff" : "#000000",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transform: [{ translateY: -3 }, { translateX: -3 }]
              }}
              className={isDark ? "bg-zinc-800" : "bg-zinc-200"}
            >
              <Ionicons name="close-circle" size={18} color={isDark ? "#ffffff" : "#000000"} />
              <Text className={`font-black text-xs uppercase ${isDark ? "text-white" : "text-black"}`}>
                CLEAR
              </Text>
            </TouchableOpacity>
          </View>

          {/* SHUFFLE */}
          <View style={styles.actionBtnWrapper}>
            {/* Shadow */}
            <View
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
              className={isDark ? "bg-white" : "bg-black"}
            />
            {/* Body */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={shuffleRack}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 16,
                borderWidth: 3,
                borderColor: isDark ? "#ffffff" : "#000000",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transform: [{ translateY: -3 }, { translateX: -3 }]
              }}
              className="bg-cyan-400"
            >
              <Ionicons name="shuffle" size={18} color="#000000" />
              <Text className="text-black font-black text-xs uppercase">
                SHUFFLE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rack */}
        <View className="flex-row gap-2 h-20 justify-center w-full">
          {rackTiles.map((tile) => {
            const isThisPressed = pressedRackId === tile.id;
            const translateOffset = !isThisPressed ? -4 : 0;
            return (
              <View key={`rack-${tile.id}`} style={styles.tileWrapper}>
                {/* Shadow */}
                <View
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                  className={isDark ? "bg-white" : "bg-black"}
                />
                {/* Tile Face */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={() => setPressedRackId(tile.id)}
                  onPressOut={() => setPressedRackId(null)}
                  onPress={() => handleTapRack(tile.id)}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 16,
                    borderWidth: 3,
                    borderColor: isDark ? "#ffffff" : "#000000",
                    justifyContent: "center",
                    alignItems: "center",
                    transform: [
                      { translateY: translateOffset },
                      { translateX: translateOffset }
                    ]
                  }}
                  className="bg-amber-100"
                >
                  <Text className="text-amber-900 font-black text-3xl">
                    {tile.char}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.submitWrapper} className="mb-4">
        {/* Shadow */}
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          className={isDark ? "bg-white" : "bg-black"}
        />
        {/* Face */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => { if (timer > 0 && !isSubmitting) setIsSubmitPressed(true); }}
          onPressOut={() => setIsSubmitPressed(false)}
          onPress={submitWord}
          disabled={timer <= 0 || isSubmitting}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 24,
            borderWidth: 4,
            borderColor: isDark ? "#ffffff" : "#000000",
            alignItems: "center",
            justifyContent: "center",
            transform: [
              { translateY: timer <= 0 || isSubmitting || isSubmitPressed ? 0 : -6 },
              { translateX: timer <= 0 || isSubmitting || isSubmitPressed ? 0 : -6 }
            ]
          }}
          className={timer <= 0 || isSubmitting ? (isDark ? "bg-zinc-700 opacity-50" : "bg-zinc-300 opacity-50") : "bg-blue-400"}
        >
          <Text className="text-black font-black text-2xl tracking-widest uppercase">
            SUBMIT WORD
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hudWrapper: {
    width: 120,
    height: 60,
    position: "relative",
  },
  feedbackWrapper: {
    position: "absolute",
    top: 76,
    width: "70%",
    height: 48,
    zIndex: 20,
  },
  tileWrapper: {
    width: 56,
    height: 64,
    position: "relative",
  },
  actionBtnWrapper: {
    width: 120,
    height: 46,
    position: "relative",
  },
  submitWrapper: {
    width: "100%",
    maxWidth: 340,
    height: 64,
    position: "relative",
  }
});
