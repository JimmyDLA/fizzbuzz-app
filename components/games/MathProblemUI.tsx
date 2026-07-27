import React, { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet, Modal } from "react-native";
import { useSelector } from "react-redux";
import * as Haptics from "expo-haptics";
import { useGameData } from "./useGameData";
import { RootState } from "../../store/store";

export function MathProblemUI() {
  const { myPlayer, sendAction } = useGameData();
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) {}

  const handleAnswer = (ans: number, idx: number) => {
    if (myPlayer?.gameScore === -1 || gameData.gameOver) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendAction({ action: "answer", answer: ans });
  };

  return (
    <View className="flex-1 items-center justify-center pt-2 w-full px-6">
      <Text
        className={`text-2xl font-black mb-6 text-center uppercase tracking-widest ${
          isDark ? "text-white" : "text-black"
        }`}
        style={{
          textShadowColor: isDark ? "#ec4899" : "#facc15",
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 0,
        }}
      >
        {gameData.index < gameData.totalQuestions
          ? `SOLVE QUICKLY! (${(gameData.index ?? 0) + 1}/${gameData.totalQuestions ?? 0})`
          : "Done!"}
      </Text>

      {/* Question Card */}
      <View style={styles.questionWrapper} className="mb-10">
        {/* Card Shadow */}
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
          className={isDark ? "bg-white" : "bg-black"}
        />

        {/* Card Body */}
        <View
          style={{
            borderRadius: 28,
            borderWidth: 4,
            borderColor: isDark ? "#ffffff" : "#000000",
            transform: [{ translateY: -6 }, { translateX: -6 }],
            alignItems: "center",
            justifyContent: "center",
          }}
          className={isDark ? "bg-yellow-500" : "bg-yellow-300"}
        >
          <Text
            className="text-black text-8xl font-black py-6"
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {gameData.question || "?"}
          </Text>
        </View>
      </View>

      {/* Option Buttons Grid */}
      <View className="flex-row flex-wrap justify-between w-full">
        {gameData.options?.map((opt: number, idx: number) => {
          const isLocked = gameData.isLockedOut;
          const isGameOver = gameData.gameOver;
          const isTransitioning = gameData.isTransitioning;
          const isDisabled = isLocked || isGameOver || isTransitioning;
          const isCorrect = isGameOver && opt === gameData.correct;
          const isThisPressed = pressedIdx === idx;

          let btnBg = isDark ? "bg-cyan-400" : "bg-cyan-300";
          if (isLocked) {
            btnBg = "bg-zinc-600 opacity-50";
          } else if (isCorrect) {
            btnBg = "bg-emerald-400";
          }

          return (
            <View key={idx} style={styles.optionWrapper} className="mb-4">
              {/* Button Shadow */}
              <View
                style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                className={isDark ? "bg-white" : "bg-black"}
              />

              {/* Button Body */}
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => {
                  if (!isDisabled) setPressedIdx(idx);
                }}
                onPressOut={() => setPressedIdx(null)}
                onPress={() => handleAnswer(opt, idx)}
                disabled={isDisabled}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 24,
                  borderWidth: 4,
                  borderColor: isDark ? "#ffffff" : "#000000",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [
                    { translateY: !isThisPressed ? -4 : 0 },
                    { translateX: !isThisPressed ? -4 : 0 },
                  ],
                }}
                className={btnBg}
              >
                <Text className="text-black text-5xl font-black text-center">
                  {opt}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Transition Modal overlay */}
      <Modal visible={!!gameData.isTransitioning} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <View className="w-full max-w-sm relative">
            {/* Modal Shadow */}
            <View
              style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
              className={isDark ? "bg-white" : "bg-black"}
            />

            {/* Modal Body */}
            {(() => {
              const hasWinner = !!gameData.roundWinner && gameData.roundWinner !== "Nobody";
              return (
                <View
                  style={{
                    borderRadius: 28,
                    borderWidth: 4,
                    borderColor: isDark ? "#ffffff" : "#000000",
                    transform: [{ translateY: -6 }, { translateX: -6 }],
                    paddingHorizontal: 24,
                    paddingVertical: 32,
                    alignItems: "center",
                  }}
                  className={hasWinner ? "bg-emerald-400" : "bg-red-400"}
                >
                  <Text className="text-black font-black text-xl tracking-[0.2em] mb-2 text-center uppercase">
                    CORRECT ANSWER
                  </Text>
                  <Text
                    className="text-black text-6xl font-black text-center mb-6 tracking-tight px-2"
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {gameData.correctAnswer}
                  </Text>

                  <View className="bg-black/20 w-3/4 h-[3px] rounded-full mb-6" />

                  <Text
                    className="text-white font-black text-2xl text-center tracking-wider bg-black px-5 py-2 rounded-2xl border-2 border-black"
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {hasWinner ? gameData.roundWinner : "NOBODY"}
                  </Text>
                  <Text className="text-black/85 font-black text-xs uppercase mt-2 tracking-[0.3em] text-center">
                    {hasWinner ? "SOLVED THE PROBLEM!" : "SOLVED THE PROBLEM"}
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  questionWrapper: {
    width: "100%",
    height: 140,
    position: "relative",
  },
  optionWrapper: {
    width: "48%",
    aspectRatio: 1,
    position: "relative",
  },
});
