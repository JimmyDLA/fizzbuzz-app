import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

interface ModeCardProps {
  title: string;
  emoji: string;
  description: string;
  bgColorClass: string;
  onPress: () => void;
  className?: string;
}

export function ModeCard({
  title,
  emoji,
  description,
  bgColorClass,
  onPress,
  className = "",
}: ModeCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => {
        setIsPressed(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      className={`w-full ${className}`}
    >
      <View style={{ height: 160, position: "relative" }}>
        {/* Behind Shadow */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 24, top: 8, left: 8 },
          ]}
          className={isDark ? "bg-white" : "bg-black"}
        />

        {/* Card Face */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: 24,
              borderWidth: 4,
              borderColor: isDark ? "#ffffff" : "#000000",
              padding: 20,
              justifyContent: "space-between",
              transform: [
                { translateY: !isPressed ? -4 : 0 },
                { translateX: !isPressed ? -4 : 0 },
              ],
            },
          ]}
          className={bgColorClass}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-3xl font-black text-black tracking-tight">
              {title}
            </Text>
            <Text className="text-3xl font-black">{emoji}</Text>
          </View>
          
          <Text className="text-base font-bold text-black/80">
            {description}
          </Text>
          
          <View className="bg-white border-2 border-black rounded-xl py-2 px-4 self-end">
            <Text className="font-black text-black">START PLAYING →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
