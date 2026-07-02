import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface RetroButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "neutral" | "success" | "danger";
  colorClass?: string;
  shadowColorClass?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function RetroButton({
  title,
  onPress,
  variant = "primary",
  colorClass,
  shadowColorClass = "bg-black",
  disabled = false,
  style,
}: RetroButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // Default color mappings matching the Memphis/Neo-Brutalist palette
  const baseColors = {
    primary: "bg-emerald-400", // Vibrant retro cyan
    secondary: "bg-yellow-400", // Taxi yellow
    neutral: "bg-white", // Neutral gray
    success: "bg-cyan-600", // Playful retro green
    danger: "bg-pink-400", // Hot pink
  };

  const selectedColorClass = colorClass || baseColors[variant];

  const handlePressIn = () => {
    if (disabled) return;
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? undefined : onPress}
      style={[styles.container, style]}
    >
      <View style={styles.buttonWrapper}>
        {/* Shadow block offset */}
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
          className={shadowColorClass}
        />
        {/* Foreground button content */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: 20,
              borderWidth: 4,
              borderColor: "#000000",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 16,
              transform: [
                { translateY: isPressed ? 4 : 0 },
                { translateX: isPressed ? 4 : 0 },
              ],
            },
          ]}
          className={selectedColorClass}
        >
          <Text
            className={`text-${variant === "neutral" ? "black" : "white"} text-2xl font-black tracking-widest uppercase text-center`}
            style={variant === "neutral" ? {} : styles.textShadow}
          >
            {title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  buttonWrapper: {
    height: 72,
    position: "relative",
    width: "100%",
  },
  textShadow: {
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
});
