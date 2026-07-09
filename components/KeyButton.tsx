import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

  const handlePressIn = () => {
    if (disabled) return;
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      style={{ flex: flexSpan, margin: 6 }}
    >
      <View style={{ height: 64, position: "relative" }}>
        {/* Shadow block */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 16, top: 4, left: 4 },
          ]}
          className={shadowColorClass}
        />
        {/* Foreground button */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: 16,
              borderWidth: 3,
              borderColor: "#000000",
              alignItems: "center",
              justifyContent: "center",
              transform: [
                { translateY: !isPressed ? -4 : 0 },
                { translateX: !isPressed ? -4 : 0 },
              ],
            },
          ]}
          className={colorClass}
        >
          <Text className="text-2xl font-black text-black tracking-wider uppercase text-center">
            {label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
