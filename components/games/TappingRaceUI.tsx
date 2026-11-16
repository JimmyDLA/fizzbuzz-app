import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useGameData } from "./useGameData";

export function TappingRaceUI() {
  const { players, selectedPlayers, timer, myPlayer, sendAction } =
    useGameData();
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    if (timer <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendAction({ action: "tap" });
  };

  return (
    <View className="flex-1 items-center justify-center pt-8 w-full px-6">
      <Text
        className={`text-4xl font-black mb-10 text-center uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
        style={{
          textShadowColor: isDark ? "#ec4899" : "#facc15",
          textShadowOffset: { width: 3, height: 3 },
          textShadowRadius: 0,
        }}
      >
        TAP AS FAST AS YOU CAN!
      </Text>

      {/* Tapping Button Container */}
      <View style={styles.buttonWrapper} className="mb-10">
        {/* Behind Shadow */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 9999 },
          ]}
          className={isDark ? "bg-white" : "bg-black"}
        />

        {/* Button Face */}
        <TouchableOpacity
          activeOpacity={1}
          disabled={timer <= 0}
          onPressIn={() => {
            if (timer > 0) setIsPressed(true);
          }}
          onPressOut={() => setIsPressed(false)}
          onPress={handlePress}
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: 9999,
              borderWidth: 6,
              borderColor: isDark ? "#ffffff" : "#000000",
              alignItems: "center",
              justifyContent: "center",
              transform: [
                { translateY: !isPressed ? -8 : 0 },
                { translateX: !isPressed ? -8 : 0 },
              ],
            },
          ]}
          className={
            timer <= 0
              ? "bg-zinc-600 opacity-50"
              : isDark
                ? "bg-cyan-400"
                : "bg-pink-400"
          }
        >
          <Text className="text-black text-8xl font-black">
            {myPlayer?.gameScore || 0}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Opponents Grid */}
      <View className="flex-row flex-wrap justify-center gap-4 w-full">
        {players
          .filter(
            (p: any) =>
              p.id !== myPlayer?.id && selectedPlayers?.includes(p.id),
          )
          .map((p: any) => (
            <View key={p.id} style={styles.opponentCardWrapper}>
              {/* Card Shadow */}
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 16, top: 4, left: 4 },
                ]}
                className={isDark ? "bg-white" : "bg-black"}
              />

              {/* Card Body */}
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 3,
                  borderColor: isDark ? "#ffffff" : "#000000",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                className={isDark ? "bg-zinc-800" : "bg-white"}
              >
                <Text
                  className={`font-black text-center text-sm uppercase ${isDark ? "text-white" : "text-black"}`}
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
                <Text
                  className="text-yellow-400 font-black text-2xl text-center mt-1"
                  style={{
                    textShadowColor: "#000000",
                    textShadowOffset: { width: 1.5, height: 1.5 },
                    textShadowRadius: 0,
                  }}
                >
                  {p.gameScore || 0}
                </Text>
              </View>
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    width: 240,
    height: 240,
    position: "relative",
  },
  opponentCardWrapper: {
    width: "45%",
    minWidth: 120,
    position: "relative",
    marginBottom: 8,
  },
});
