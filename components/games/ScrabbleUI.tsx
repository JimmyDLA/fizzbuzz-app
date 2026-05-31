import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { colyseusService } from "../../store/colyseusService";
import { useGameData } from "./useGameData";

type TileState = { id: number; char: string; placedIndex: number | null };

export function ScrabbleUI() {
  const { timer, myPlayer, sendAction, isPractice } = useGameData();
  const room = isPractice ? colyseusService.practiceRoom : colyseusService.room;

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
  }, [myPlayer?.gameData]);

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
      setFeedback({ text: "TOO SHORT!", type: "error" });
      triggerShake();
      setTimeout(() => setFeedback(null), 1500);
      return;
    }

    setIsSubmitting(true);
    sendAction({ action: "submit_word", word });

    // Safety timeout to prevent permanent UI lock in case of network loss
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  const clearBoard = () => {
    setTiles((prev) => prev.map((t) => ({ ...t, placedIndex: null })));
  };

  const shuffleRack = () => {
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
      <View className="flex-1 items-center justify-center">
        <Text className="text-white font-black text-2xl">
          LOADING SCRABBLE...
        </Text>
      </View>
    );
  }

  const placedTiles = [0, 1, 2, 3, 4].map((idx) =>
    tiles.find((t) => t.placedIndex === idx),
  );
  const rackTiles = tiles.filter((t) => t.placedIndex === null);

  return (
    <View className="flex-1 items-center justify-between w-full px-4 py-8">
      {/* HUD */}
      <View className="items-center w-full">
        <View className="flex-row justify-between w-full px-4">
          <View className="items-center bg-black/40 px-4 py-2 rounded-xl relative">
            <Text className="text-white/60 font-bold text-xs uppercase tracking-widest">
              Score
            </Text>
            <Text className="text-yellow-400 font-black text-xl">
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
              className="text-green-400 font-black text-2xl"
            >
              {pointsText}
            </Animated.Text>
          </View>
        </View>

        {feedback && (
          <View
            className={`mt-6 px-6 py-2 rounded-full absolute top-16 z-10 ${
              feedback.type === "success"
                ? "bg-green-500"
                : feedback.type === "error"
                  ? "bg-red-500"
                  : "bg-blue-500"
            }`}
          >
            <Text className="text-white font-black text-xl">
              {feedback.text}
            </Text>
          </View>
        )}
      </View>

      {/* Play Area */}
      <View className="w-full items-center mb-8">
        {/* Word Slots */}
        <Animated.View
          style={{ transform: [{ translateX: shakeAnim }] }}
          className="flex-row gap-2 mb-12"
        >
          {[0, 1, 2, 3, 4].map((slotIdx) => {
            const tile = placedTiles[slotIdx];
            return (
              <TouchableOpacity
                key={`slot-${slotIdx}`}
                activeOpacity={0.7}
                onPress={() => tile && handleTapSlot(slotIdx)}
                className={`w-14 h-16 rounded-lg justify-center items-center ${
                  tile
                    ? "bg-amber-100 border-b-4 border-amber-300"
                    : "bg-black/20 border-2 border-dashed border-white/20"
                }`}
              >
                {tile && (
                  <Text className="text-amber-900 font-black text-3xl">
                    {tile.char}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Action Buttons */}
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={clearBoard}
            className="bg-zinc-800 px-4 py-3 rounded-xl border-b-4 border-zinc-950 flex-row items-center gap-2"
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text className="text-white font-bold">CLEAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={shuffleRack}
            className="bg-blue-600 px-4 py-3 rounded-xl border-b-4 border-blue-900 flex-row items-center gap-2"
          >
            <Ionicons name="shuffle" size={20} color="#fff" />
            <Text className="text-white font-bold">SHUFFLE</Text>
          </TouchableOpacity>
        </View>

        {/* Rack */}
        <View className="flex-row gap-2 h-16 justify-center w-full">
          {rackTiles.map((tile) => (
            <TouchableOpacity
              key={`rack-${tile.id}`}
              activeOpacity={0.7}
              onPress={() => handleTapRack(tile.id)}
              className="w-14 h-16 bg-amber-100 rounded-lg justify-center items-center border-b-4 border-amber-300"
            >
              <Text className="text-amber-900 font-black text-3xl">
                {tile.char}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={submitWord}
        disabled={timer <= 0 || isSubmitting}
        className={`w-full max-w-sm py-4 rounded-2xl items-center border-b-8 mb-4 ${
          timer <= 0 || isSubmitting
            ? "bg-zinc-600 border-zinc-800"
            : "bg-blue-500 border-blue-700"
        }`}
      >
        <Text className="text-white font-black text-2xl tracking-widest">
          SUBMIT WORD
        </Text>
      </TouchableOpacity>
    </View>
  );
}
