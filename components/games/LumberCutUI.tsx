import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ScrollView,
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

  let gameData: any = {};
  if (myPlayer?.gameData) {
    try {
      gameData = JSON.parse(myPlayer.gameData);
    } catch (e) {}
  }

  const teams = gameData.teams || [];
  const myTeam = teams.find((t: any) => t.members.includes(myPlayer?.id));

  const handlePull = (side: "left" | "right") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendAction({ action: "pull", side });
  };

  const target = gameData.targetPairs || 20;

  // Determine button mapping arrays
  const isSolo = myTeam?.members.length === 1;
  const amILeftPuller = myTeam?.members[0] === myPlayer?.id;

  return (
    <View className="flex-1 items-center justify-center w-full pt-4 px-6">
      {gameData.gameOver && gameData.winners?.includes(myPlayer?.id) && (
        <Text
          className="text-green-500 text-5xl font-black mb-6 text-center uppercase"
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
          className="text-red-500 text-5xl font-black mb-6 text-center uppercase"
          style={{
            textShadowColor: isDark ? "#ffffff" : "#000000",
            textShadowOffset: { width: 3, height: 3 },
            textShadowRadius: 0,
          }}
        >
          TOO SLOW!!
        </Text>
      )}

      {/* Teams progress panel */}
      <View style={styles.teamsPanelWrapper} className="mb-8">
        {/* Shadow Backing */}
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]}
          className={isDark ? "bg-white" : "bg-black"}
        />

        {/* Panel Body */}
        <View
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 32,
            borderWidth: 4,
            borderColor: isDark ? "#ffffff" : "#000000",
            padding: 16,
            transform: [{ translateY: -6 }, { translateX: -6 }],
          }}
          className={isDark ? "bg-zinc-900" : "bg-orange-100"}
        >
          <ScrollView
            className="flex-1 w-full"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            {[...teams]
              .sort((a, b) => b.pairs - a.pairs)
              .map((t: any, idx: number) => {
                const progress = Math.min((t.pairs / target) * 100, 100);
                const isMyTeam = t.id === myTeam?.id;
                return (
                  <View key={idx} className="mb-4">
                    <View className="flex-row justify-between mb-2 px-1">
                      <Text
                        className={`font-black uppercase tracking-wider ${isMyTeam ? (isDark ? "text-cyan-400" : "text-cyan-600") : isDark ? "text-zinc-500" : "text-zinc-400"}`}
                      >
                        {t.id}
                      </Text>
                      <Text
                        className={`font-black tracking-widest ${isMyTeam ? "text-yellow-500" : "text-zinc-500"}`}
                      >
                        {t.pairs} / {target}
                      </Text>
                    </View>
                    <View
                      style={{ borderColor: isDark ? "#ffffff" : "#000000" }}
                      className="w-full h-9 bg-zinc-800 rounded-full border-3 overflow-hidden relative justify-center"
                    >
                      <View
                        className={`absolute h-full left-0 ${isMyTeam ? (isDark ? "bg-cyan-400" : "bg-cyan-300") : "bg-orange-500 opacity-60"}`}
                        style={{ width: `${progress}%` }}
                      />
                      <Text className="text-center font-black text-black tracking-[4px] z-10 text-[10px] uppercase">
                        LUMBER
                      </Text>
                    </View>
                  </View>
                );
              })}
          </ScrollView>
        </View>
      </View>

      {/* PHYSICAL CONTROLS */}
      {!gameData.gameOver && timer > 0 && (
        <View className="w-full pb-12">
          {/* Saw status banner */}
          <View style={styles.sawBannerWrapper} className="mb-8">
            {/* Shadow Backing */}
            <View
              style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
              className={isDark ? "bg-white" : "bg-black"}
            />
            {/* Body */}
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 20,
                borderWidth: 4,
                borderColor: isDark ? "#ffffff" : "#000000",
                justifyContent: "center",
                alignItems: "center",
                transform: [{ translateY: -4 }, { translateX: -4 }],
              }}
              className={isDark ? "bg-zinc-800" : "bg-yellow-100"}
            >
              <Text
                className={`text-center font-black text-2xl ${isDark ? "text-white" : "text-black"} tracking-[0.2em] uppercase`}
              >
                CROSSCUT SAW
              </Text>
            </View>
          </View>

          {/* Pull Buttons Grid */}
          <View className="flex-row justify-center w-full gap-4">
            {(isSolo || amILeftPuller) &&
              (() => {
                const isEnabled = myTeam?.next === "left";
                const translateOffset = isEnabled && !isLeftPressed ? -8 : 0;
                return (
                  <View style={styles.buttonContainer}>
                    {/* Shadow Backing */}
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        { borderRadius: 24 },
                      ]}
                      className={isDark ? "bg-white" : "bg-black"}
                    />
                    {/* Button Body */}
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
                    {/* Shadow Backing */}
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        { borderRadius: 24 },
                      ]}
                      className={isDark ? "bg-white" : "bg-black"}
                    />
                    {/* Button Body */}
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
  teamsPanelWrapper: {
    width: "100%",
    height: 250,
    position: "relative",
  },
  sawBannerWrapper: {
    width: "100%",
    height: 64,
    position: "relative",
  },
  buttonContainer: {
    flex: 1,
    height: 120,
    position: "relative",
  },
});
