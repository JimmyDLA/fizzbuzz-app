import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useDispatch } from "react-redux";
import { memphisShapes } from "../constants/theme";
import { setAgeVerified, setBirthYear, setGameMode } from "../store/lobbySlice";
import { AgeGateDenied } from "./AgeGateDenied";
import { AgeGateKeypad } from "./AgeGateKeypad";
import { ModeCard } from "./ModeCard";

export function AgeGateModal() {
  const dispatch = useDispatch();
  const [step, setStep] = useState<"select" | "keypad" | "denied">("select");
  const [yearStr, setYearStr] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Animation values for visual flair
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleSelectPartyMode = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch(setGameMode("party"));
    dispatch(setAgeVerified(true));
    dispatch(setBirthYear(null));
  };

  const handleSelectDrinkingMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("keypad");
  };

  const handleKeyPress = (num: string) => {
    if (yearStr.length < 4) {
      setYearStr((prev) => prev + num);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setYearStr("");
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (yearStr.length < 4) {
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsVerifying(true);
    // Simulate brief processing for game feel
    setTimeout(() => {
      setIsVerifying(false);
      const birthYearInt = parseInt(yearStr, 10);
      const currentYear = 2026; // Current local time in project context is 2026
      const age = currentYear - birthYearInt;

      // Basic year validation sanity checks
      if (birthYearInt < 1920 || birthYearInt > currentYear) {
        triggerShake();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setYearStr("");
        return;
      }

      if (age >= 21) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dispatch(setGameMode("drinking"));
        dispatch(setAgeVerified(true));
        dispatch(setBirthYear(birthYearInt));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStep("denied");
      }
    }, 400);
  };

  const handleGoToPartyMode = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch(setGameMode("party"));
    dispatch(setAgeVerified(true));
    dispatch(setBirthYear(null));
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setYearStr("");
    setStep("keypad");
  };

  // Helper to render Memphis decorative background elements
  const renderBackgroundDebris = () => {
    return memphisShapes.map((shape, i) => {
      const transform = shape.rotate ? [{ rotate: shape.rotate }] : [];
      if (shape.type === "dots") {
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              top: shape.top as any,
              left: shape.left as any,
              opacity: 0.15,
            }}
          >
            <Text
              className={`font-black tracking-widest ${shape.color} text-lg`}
            >
              •••••{"\n"}•••••{"\n"}•••••
            </Text>
          </View>
        );
      }
      return (
        <View
          key={i}
          style={{
            position: "absolute",
            top: shape.top as any,
            left: shape.left as any,
            width: shape.size,
            height: shape.size,
            borderRadius: shape.type === "circle" ? 999 : 4,
            borderWidth: 2,
            borderColor: "#000000",
            transform: transform as any,
            opacity: 0.4,
          }}
          className={shape.color}
        />
      );
    });
  };

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      className="bg-amber-50 justify-center items-center px-6 z-[9999]"
    >
      {renderBackgroundDebris()}

      {step === "select" && (
        <View className="w-full max-w-sm items-center">
          <Text
            className="text-5xl font-black text-black text-center mb-10 tracking-tighter uppercase"
            style={{
              textShadowColor: "#facc15",
              textShadowOffset: { width: 3, height: 3 },
              textShadowRadius: 0,
            }}
          >
            PARTY BASH!
          </Text>

          {/* Card 1: Party Mode */}
          <ModeCard
            title="PARTY MODE"
            emoji="🎉"
            description="ALL AGES & SOBER FRIENDLY. Games, trivia, and group fun!"
            bgColorClass="bg-cyan-300"
            onPress={handleSelectPartyMode}
            className="mb-6"
          />

          {/* Card 2: Drinking Mode */}
          <ModeCard
            title="DRINKING MODE"
            emoji="🍺"
            description="21+ ONLY. High-energy drinking challenges & group icebreakers."
            bgColorClass="bg-pink-400"
            onPress={handleSelectDrinkingMode}
          />
        </View>
      )}

      {step === "keypad" && (
        <AgeGateKeypad
          yearStr={yearStr}
          isVerifying={isVerifying}
          shakeAnim={shakeAnim}
          onKeyPress={handleKeyPress}
          onClear={handleClear}
          onSubmit={handleSubmit}
          onBack={() => {
            setStep("select");
            setYearStr("");
          }}
        />
      )}

      {step === "denied" && (
        <AgeGateDenied
          onPlayPartyMode={handleGoToPartyMode}
          onRetry={handleRetry}
        />
      )}
    </View>
  );
}
