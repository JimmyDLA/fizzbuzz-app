import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

interface KeyButtonProps {
  label: string;
  onPress: () => void;
  colorClass?: string;
  shadowColorClass?: string;
  flexSpan?: number;
  disabled?: boolean;
}

export function KeyButton({
  label,
  onPress,
  colorClass = "bg-white",
  shadowColorClass = "bg-black",
  flexSpan = 1,
  disabled = false,
}: KeyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const activeColorClass = colorClass === "bg-white"
    ? (isDark ? "bg-zinc-800" : "bg-white")
    : colorClass;

  const activeShadowColorClass = shadowColorClass === "bg-black"
    ? (isDark ? "bg-white" : "bg-black")
    : shadowColorClass;

  const handlePressIn = () => {
    if (disabled) return;
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const textColorClass = isDark
    ? (activeColorClass.includes("zinc-800") ? "text-white" : "text-black")
    : "text-black";

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? undefined : onPress}
      style={{ flex: flexSpan, margin: 6 }}
    >
      <View style={{ height: 64, position: "relative" }}>
        {/* Shadow block */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 16, top: 4, left: 4 },
          ]}
          className={activeShadowColorClass}
        />
        {/* Foreground button */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: 16,
              borderWidth: 3,
              borderColor: isDark ? "#ffffff" : "#000000",
              alignItems: "center",
              justifyContent: "center",
              transform: [
                { translateY: !isPressed ? -4 : 0 },
                { translateX: !isPressed ? -4 : 0 },
              ],
            },
          ]}
          className={activeColorClass}
        >
          <Text className={`text-2xl font-black ${textColorClass} tracking-wider uppercase text-center`}>
            {label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
