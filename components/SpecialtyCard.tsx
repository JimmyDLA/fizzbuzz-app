import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import {
  SPECIALTY_CARDS,
  SpecialtyCardType,
} from "../constants/specialtyCards";
import { RootState } from "../store/store";
import { playButtonClickSound } from "../utils/sound";

export interface SpecialtyCardProps {
  type: SpecialtyCardType;
  size?: "sm" | "md" | "lg" | "xl";
  isSelected?: boolean;
  isDisabled?: boolean;
  showRarityBadge?: boolean;
  onPress?: () => void;
  style?: any;
}

export function SpecialtyCard({
  type,
  size = "md",
  isSelected = false,
  isDisabled = false,
  showRarityBadge = false,
  onPress,
  style,
}: SpecialtyCardProps) {
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";

  const config = SPECIALTY_CARDS[type] || SPECIALTY_CARDS.turbo;

  // Exact sizing specs matching playing card aspect ratio 1 : 1.636
  const sizeStyles = {
    sm: {
      width: 100,
      height: 162,
      borderRadius: 16,
      borderWidth: 3,
      shadowOffset: 3,
      suitSize: 16,
      titleSize: 11,
      titleLineHeight: 12,
      circleSize: 46,
      iconSize: 22,
      descSize: 8,
      raritySize: 7,
      paddingHorizontal: 8,
      paddingVertical: 10,
    },
    md: {
      width: 140,
      height: 228,
      borderRadius: 20,
      borderWidth: 3.5,
      shadowOffset: 5,
      suitSize: 20,
      titleSize: 14,
      titleLineHeight: 15,
      circleSize: 64,
      iconSize: 32,
      descSize: 10,
      raritySize: 8,
      paddingHorizontal: 12,
      paddingVertical: 14,
    },
    lg: {
      width: 180,
      height: 294,
      borderRadius: 24,
      borderWidth: 4,
      shadowOffset: 6,
      suitSize: 24,
      titleSize: 17,
      titleLineHeight: 18,
      circleSize: 82,
      iconSize: 42,
      descSize: 11,
      raritySize: 9,
      paddingHorizontal: 14,
      paddingVertical: 16,
    },
    xl: {
      width: 286,
      height: 429,
      borderRadius: 28,
      borderWidth: 4.5,
      shadowOffset: 7,
      suitSize: 28,
      titleSize: 36,
      titleLineHeight: 21,
      circleSize: 150,
      iconSize: 100,
      descSize: 16,
      raritySize: 10,
      paddingHorizontal: 16,
      paddingVertical: 18,
    },
  }[size];

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playButtonClickSound();
    if (onPress) {
      onPress();
    }
  };

  const renderVectorIcon = () => {
    const iconColor = "#000000";
    if (config.iconFamily === "Ionicons") {
      return (
        <Ionicons
          name={config.iconName as any}
          size={sizeStyles.iconSize}
          color={iconColor}
        />
      );
    }
    if (config.iconFamily === "FontAwesome5") {
      return (
        <FontAwesome5
          name={config.iconName as any}
          size={sizeStyles.iconSize}
          color={iconColor}
        />
      );
    }
    return (
      <MaterialCommunityIcons
        name={config.iconName as any}
        size={sizeStyles.iconSize}
        color={iconColor}
      />
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress && !isDisabled ? 0.85 : 1}
      onPress={handlePress}
      disabled={!onPress || isDisabled}
      style={[
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          position: "relative",
          opacity: isDisabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {/* Solid Black Neo-Brutalist Behind Shadow */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.borderRadius,
            top: sizeStyles.shadowOffset,
            left: sizeStyles.shadowOffset,
            backgroundColor: "#000000",
          },
        ]}
      />

      {/* Main Card Face */}
      <View
        style={{
          width: "100%",
          height: "100%",
          borderRadius: sizeStyles.borderRadius,
          borderWidth: sizeStyles.borderWidth,
          borderColor: "#000000",
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: config.hexColor,
        }}
      >
        {/* Selection Indicator Glow */}
        {isSelected && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: sizeStyles.borderRadius - 2,
                borderWidth: 4,
                borderColor: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              },
            ]}
          />
        )}
        {/* Header Row: Suit Top-Left + Bold Block Title */}
        <View className="absolute top-4 left-4 items-center justify-center bg-black px-1.5 py-0.5 rounded-md">
          <Text
            style={{ fontSize: sizeStyles.raritySize }}
            className="font-black text-white uppercase"
          >
            {config.rarityLabel}
          </Text>
        </View>
        <View className="w-full flex-row items-center justify-center">
          <Text
            style={{
              fontSize: sizeStyles.titleSize,
            }}
            className="font-black text-black pt-5 uppercase tracking-wider text-center"
          >
            {config.displayTitle}
          </Text>
        </View>
        {/* Center Circular Vector Icon Emblem */}
        <View
          style={{
            width: sizeStyles.circleSize,
            height: sizeStyles.circleSize,
            borderRadius: 999,
            borderWidth: 7,
            borderColor: "#000000",
            // backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {renderVectorIcon()}
        </View>
        {/* Bottom Effect Description */}
        <View className="w-full">
          <Text
            style={{ fontSize: sizeStyles.descSize }}
            className="font-black text-black text-center uppercase tracking-wide leading-tight"
            numberOfLines={4}
          >
            {config.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Convenient export aliases
export const ShieldCard = (props: Omit<SpecialtyCardProps, "type">) => (
  <SpecialtyCard type="shield" {...props} />
);
export const TurboCard = (props: Omit<SpecialtyCardProps, "type">) => (
  <SpecialtyCard type="turbo" {...props} />
);
export const DoublePointsCard = (props: Omit<SpecialtyCardProps, "type">) => (
  <SpecialtyCard type="double_points" {...props} />
);
export const RespinCard = (props: Omit<SpecialtyCardProps, "type">) => (
  <SpecialtyCard type="respin" {...props} />
);
export const WildCard = (props: Omit<SpecialtyCardProps, "type">) => (
  <SpecialtyCard type="wild_card" {...props} />
);
