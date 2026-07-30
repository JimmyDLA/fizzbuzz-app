import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useGameData } from "./useGameData";

export function LumberCutUI() {
  const { timer, myPlayer, sendAction } = useGameData();
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);
  const [isSawing, setIsSawing] = useState(false);
  const sawTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (sawTimeoutRef.current) {
        clearTimeout(sawTimeoutRef.current);
      }
    };
  }, []);

  const sawTranslateX = useRef(new Animated.Value(-30)).current;
  const sawTranslateY = useRef(new Animated.Value(0)).current;

  let gameData: any = {};
  if (myPlayer?.gameData) {
    try {
      gameData = JSON.parse(myPlayer.gameData);
    } catch (e) {}
  }

  const teams = gameData.teams || [];
  const myTeam = teams.find((t: any) => t.members.includes(myPlayer?.id));
  const target = gameData.targetPairs || 20;

  const currentPairs = myTeam?.pairs || 0;
  const progressRatio = Math.min(1, currentPairs / target);

  // Vertical Y translation from top of log (0) down to bottom (160)
  const targetY = progressRatio * 160;
  // Horizontal X translation (-30 when next is right, +30 when next is left)
  const targetX = myTeam?.next === "right" ? -30 : 30;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sawTranslateX, {
        toValue: targetX,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(sawTranslateY, {
        toValue: targetY,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentPairs, myTeam?.next, targetX, targetY]);

  const handlePull = (side: "left" | "right") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendAction({ action: "pull", side });

    setIsSawing(true);
    if (sawTimeoutRef.current) {
      clearTimeout(sawTimeoutRef.current);
    }
    sawTimeoutRef.current = setTimeout(() => {
      setIsSawing(false);
    }, 2000);
  };

  const isSolo = myTeam?.members.length === 1;
  const amILeftPuller = myTeam?.members[0] === myPlayer?.id;

  return (
    <View className="flex-1 items-center justify-center w-full pt-4 px-6">
      {gameData.gameOver && gameData.winners?.includes(myPlayer?.id) && (
        <Text
          className="text-green-500 text-5xl font-black mb-4 text-center uppercase"
          style={{
            textShadowColor: isDark ? "#ffffff" : "#000000",
            textShadowOffset: { width: 3, height: 3 },
            textShadowRadius: 0,
          }}
        >
          TIMBERRR!!
        </Text>
      )}
      {gameData.gameOver && !gameData.winners?.includes(myPlayer?.id) && (
        <Text
          className="text-red-500 text-5xl font-black mb-4 text-center uppercase"
          style={{
            textShadowColor: isDark ? "#ffffff" : "#000000",
            textShadowOffset: { width: 3, height: 3 },
            textShadowRadius: 0,
          }}
        >
          TOO SLOW!!
        </Text>
      )}

      {/* Progress HUD Badge */}
      <View style={styles.hudBadgeWrapper} className="mb-4">
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
          className={isDark ? "bg-white" : "bg-black"}
        />
        <View
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 16,
            borderWidth: 3,
            borderColor: isDark ? "#ffffff" : "#000000",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            transform: [{ translateY: -3 }, { translateX: -3 }],
          }}
          className={isDark ? "bg-zinc-900" : "bg-orange-100"}
        >
          <Text
            className={`font-black text-sm uppercase ${isDark ? "text-cyan-400" : "text-cyan-600"}`}
          >
            {myTeam ? `TEAM ${myTeam.id}` : "SOLO"}
          </Text>
          <Text className="font-black text-base text-yellow-500 tracking-wider">
            {Math.round(progressRatio * 100)}% CUT
          </Text>
        </View>
      </View>

      {/* 3D SAWING SCENE (Replaces Teams Progress Panel) */}
      <View style={styles.sceneContainer} className="mb-6">
        {/* Layer 0 (zIndex=0): Saw Dust Lottie Animations (Background) */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { alignItems: "center", justifyContent: "center", zIndex: 0 },
          ]}
        >
          {isSawing && (
            <>
              <LottieView
                source={require("../../assets/images/saw_dust.json")}
                autoPlay
                loop={true}
                style={{
                  position: "absolute",
                  width: 150,
                  height: 150,
                  opacity: 0.85,
                  top: 178,
                }}
              />
              <LottieView
                source={require("../../assets/images/saw_dust.json")}
                autoPlay
                loop={true}
                // duration={1000}
                // speed={1.5}
                style={{
                  position: "absolute",
                  width: 200,
                  height: 200,
                  opacity: 0.85,
                  top: 178,
                }}
              />
            </>
          )}
        </View>

        {/* Layer 1 (zIndex=1): Hand Saw (Crosscut Saw) */}
        <Animated.View
          style={{
            position: "absolute",
            top: 25,
            zIndex: 1,
            transform: [
              { translateX: sawTranslateX },
              { translateY: sawTranslateY },
            ],
          }}
        >
          <Image
            source={require("../../assets/images/crosscut_saw.png")}
            style={{ width: 400, height: 100 }}
            resizeMode="stretch"
          />
        </Animated.View>

        {/* Layer 2 (zIndex=2): Lumber Log (Foreground) */}
        <View
          style={{
            position: "absolute",
            top: 35,
            zIndex: 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../../assets/images/lumber_log.png")}
            style={{ width: 220, height: 220 }}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* PHYSICAL CONTROLS */}
      {!gameData.gameOver && timer > 0 && (
        <View className="w-full pb-8">
          <View className="flex-row justify-center w-full gap-4">
            {(isSolo || amILeftPuller) &&
              (() => {
                const isEnabled = myTeam?.next === "left";
                const translateOffset = isEnabled && !isLeftPressed ? -8 : 0;
                return (
                  <View style={styles.buttonContainer}>
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        { borderRadius: 24 },
                      ]}
                      className={isDark ? "bg-white" : "bg-black"}
                    />
                    <TouchableOpacity
                      activeOpacity={1}
                      onPressIn={() => {
                        if (isEnabled) setIsLeftPressed(true);
                      }}
                      onPressOut={() => setIsLeftPressed(false)}
                      onPress={() => handlePull("left")}
                      disabled={!isEnabled}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 24,
                        borderWidth: 4,
                        borderColor: isDark ? "#ffffff" : "#000000",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: [
                          { translateY: translateOffset },
                          { translateX: translateOffset },
                        ],
                      }}
                      className={
                        isEnabled
                          ? "bg-emerald-400"
                          : isDark
                            ? "bg-zinc-700 opacity-50"
                            : "bg-zinc-300 opacity-50"
                      }
                    >
                      <Text
                        className={`text-2xl font-black uppercase tracking-wider ${isEnabled ? "text-black" : isDark ? "text-zinc-500" : "text-zinc-400"}`}
                      >
                        {"<"} PULL
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

            {(isSolo || !amILeftPuller) &&
              (() => {
                const isEnabled = myTeam?.next === "right";
                const translateOffset = isEnabled && !isRightPressed ? -8 : 0;
                return (
                  <View style={styles.buttonContainer}>
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        { borderRadius: 24 },
                      ]}
                      className={isDark ? "bg-white" : "bg-black"}
                    />
                    <TouchableOpacity
                      activeOpacity={1}
                      onPressIn={() => {
                        if (isEnabled) setIsRightPressed(true);
                      }}
                      onPressOut={() => setIsRightPressed(false)}
                      onPress={() => handlePull("right")}
                      disabled={!isEnabled}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 24,
                        borderWidth: 4,
                        borderColor: isDark ? "#ffffff" : "#000000",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: [
                          { translateY: translateOffset },
                          { translateX: translateOffset },
                        ],
                      }}
                      className={
                        isEnabled
                          ? "bg-emerald-400"
                          : isDark
                            ? "bg-zinc-700 opacity-50"
                            : "bg-zinc-300 opacity-50"
                      }
                    >
                      <Text
                        className={`text-2xl font-black uppercase tracking-wider ${isEnabled ? "text-black" : isDark ? "text-zinc-500" : "text-zinc-400"}`}
                      >
                        PULL {">"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hudBadgeWrapper: {
    width: "100%",
    height: 48,
    position: "relative",
  },
  sceneContainer: {
    width: 320,
    height: 280,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    flex: 1,
    height: 110,
    position: "relative",
  },
});
