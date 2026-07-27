import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useGameData } from "./useGameData";

export function TriviaUI() {
  const { myPlayer, sendAction } = useGameData();
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) {}

  const handleAnswer = (opt: string, idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendAction({ action: "answer", answer: opt });
  };

  const colors = [
    { bg: "bg-rose-400" },
    { bg: "bg-indigo-400" },
    { bg: "bg-cyan-400" },
    { bg: "bg-emerald-400" },
  ];

  return (
    <View className="flex-1 items-center pt-2 w-full px-6">
      <Text
        className={`text-2xl font-black mb-4 text-center uppercase tracking-widest ${isDark ? "text-white" : "text-black"}`}
        style={{
          textShadowColor: isDark ? "#ec4899" : "#facc15",
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 0,
        }}
      >
        TRIVIA RACE! ({gameData.index + 1 || 0}/{gameData.total || 10})
      </Text>

      {/* Question Card */}
      <View style={styles.questionWrapper} className="mb-6">
        {/* Card Shadow */}
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
          className={isDark ? "bg-white" : "bg-black"}
        />
        {/* Card Body */}
        <View
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 28,
            borderWidth: 4,
            borderColor: isDark ? "#ffffff" : "#000000",
            padding: 16,
            justifyContent: "center",
            alignItems: "center",
            transform: [{ translateY: -6 }, { translateX: -6 }],
          }}
          className={isDark ? "bg-yellow-500" : "bg-yellow-300"}
        >
          <Text
            className="text-black text-2xl font-black text-center leading-tight px-2"
            adjustsFontSizeToFit
            numberOfLines={4}
          >
            {gameData.question || "Fetching next question..."}
          </Text>
        </View>
      </View>

      {/* Answer Options list */}
      <ScrollView
        className="w-full flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <View className="w-full  gap-2 p-1">
          {gameData.options?.map((opt: string, idx: number) => {
            const isLocked = gameData.isLockedOut;
            const isTransitioning = gameData.isTransitioning;
            const isDisabled = isLocked || isTransitioning;
            const color = colors[idx % colors.length];
            const isThisPressed = pressedIdx === idx;
            const translateOffset = !isDisabled && !isThisPressed ? -4 : 0;

            return (
              <View key={idx} style={styles.optionWrapper}>
                {/* Shadow */}
                <View
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
                  className={isDark ? "bg-white" : "bg-black"}
                />

                {/* Touchable Button Body */}
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
                    minHeight: 72,
                    borderRadius: 20,
                    borderWidth: 4,
                    borderColor: isDark ? "#ffffff" : "#000000",
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [
                      { translateY: translateOffset },
                      { translateX: translateOffset },
                    ],
                  }}
                  className={
                    isDisabled
                      ? isDark
                        ? "bg-zinc-700 opacity-50"
                        : "bg-zinc-300 opacity-50"
                      : color.bg
                  }
                >
                  <Text
                    className="text-black text-xl font-black text-center tracking-tight"
                    numberOfLines={2}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {gameData.isLockedOut && !gameData.isTransitioning && (
          <Text className="text-red-500 font-black text-lg mt-6 tracking-widest text-center uppercase">
            Waiting for someone to get it right...
          </Text>
        )}
      </ScrollView>

      {/* Transition Modal overlay */}
      <Modal visible={!!gameData.isTransitioning} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          {(() => {
            const hasWinner =
              !!gameData.roundWinner &&
              gameData.roundWinner !== "Nobody" &&
              gameData.roundWinner !== "";
            return (
              <View className="w-full max-w-sm relative">
                {/* Modal Shadow */}
                <View
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
                  className={isDark ? "bg-white" : "bg-black"}
                />

                {/* Modal Body */}
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
                    className="text-black text-4xl font-black text-center mb-6 tracking-tight px-2"
                    adjustsFontSizeToFit
                    numberOfLines={2}
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
                    {hasWinner ? "ANSWERED CORRECTLY!" : "ANSWERED CORRECTLY"}
                  </Text>
                </View>
              </View>
            );
          })()}
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
    width: "100%",
    position: "relative",
    marginBottom: 4,
  },
  scoreBannerWrapper: {
    width: "80%",
    height: 52,
    position: "relative",
  },
});
