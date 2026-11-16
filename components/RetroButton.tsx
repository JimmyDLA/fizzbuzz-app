import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSelector } from "react-redux";
import { useClickSound } from "../hooks/useClickSound";
import { RootState } from "../store/store";

interface RetroButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "neutral" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  colorClass?: string;
  shadowColorClass?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function RetroButton({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  colorClass,
  shadowColorClass = "bg-black",
  disabled = false,
  style,
}: RetroButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";
  const playClickSound = useClickSound();

  // Default color mappings matching the Memphis/Neo-Brutalist palette
  const baseColors = {
    primary: "bg-emerald-400", // Vibrant retro cyan
    secondary: "bg-yellow-400", // Taxi yellow
    neutral: isDark ? "bg-zinc-800" : "bg-white", // Neutral gray/white
    success: "bg-cyan-600", // Playful retro green
    danger: "bg-pink-400", // Hot pink
  };

  const selectedColorClass = colorClass || baseColors[variant];
  const activeShadowColorClass =
    shadowColorClass === "bg-black"
      ? isDark
        ? "bg-white"
        : "bg-black"
      : shadowColorClass;

  const handlePressIn = () => {
    if (disabled) return;
    setIsPressed(true);
    playClickSound();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  // Determine text color based on theme and variant
  const textColorClass = isDark
    ? variant === "neutral"
      ? "text-white"
      : "text-black"
    : variant === "neutral"
      ? "text-black"
      : "text-white";

  const textShadowStyle =
    variant === "neutral" || isDark ? {} : styles.textShadow;

  const sizeConfig = {
    sm: {
      height: 40,
      borderRadius: 12,
      borderWidth: 2.5,
      offset: 3,
      fontSize: 13,
      textClass: "text-xs font-black tracking-wider",
      marginBottom: 0,
      paddingHorizontal: 8,
    },
    md: {
      height: 52,
      borderRadius: 16,
      borderWidth: 3,
      offset: 3.5,
      fontSize: 17,
      textClass: "text-base font-black tracking-widest",
      marginBottom: 8,
      paddingHorizontal: 12,
    },
    lg: {
      height: 72,
      borderRadius: 20,
      borderWidth: 4,
      offset: 4,
      fontSize: 22,
      textClass: "text-2xl font-black tracking-widest",
      marginBottom: 16,
      paddingHorizontal: 16,
    },
  }[size];

  return (
    <TouchableOpacity
      activeOpacity={1}
      delayPressIn={0}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? undefined : onPress}
      style={[{ width: "100%", marginBottom: sizeConfig.marginBottom }, style]}
    >
      <View style={{ height: sizeConfig.height, position: "relative", width: "100%" }}>
        {/* Shadow block offset */}
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: sizeConfig.borderRadius }]}
          className={activeShadowColorClass}
        />
        {/* Foreground button content */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: sizeConfig.borderRadius,
              borderWidth: sizeConfig.borderWidth,
              borderColor: isDark ? "#ffffff" : "#000000",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: sizeConfig.paddingHorizontal,
              transform: [
                { translateY: !isPressed ? -sizeConfig.offset : 0 },
                { translateX: !isPressed ? -sizeConfig.offset : 0 },
              ],
            },
          ]}
          className={selectedColorClass}
        >
          <Text
            className={`${textColorClass} ${sizeConfig.textClass} text-center`}
            style={[{ fontSize: sizeConfig.fontSize, fontWeight: "900" }, textShadowStyle]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  textShadow: {
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
});
