import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { setAgeVerified, setBirthYear, setGameMode } from "../store/lobbySlice";
import { KeyButton } from "./KeyButton";

export function AgeGateModal() {
  const dispatch = useDispatch();
  const [step, setStep] = useState<"select" | "keypad" | "denied">("select");
  const [yearStr, setYearStr] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPartyPressed, setIsPartyPressed] = useState(false);
  const [isDrinkingPressed, setIsDrinkingPressed] = useState(false);

  // Animation values for visual flair
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Memphis debris floating shapes coordinates for retro background
  const memphisShapes = [
    {
      type: "circle",
      color: "bg-yellow-400",
      size: 24,
      top: "8%",
      left: "10%",
    },
    { type: "circle", color: "bg-pink-400", size: 16, top: "75%", left: "80%" },
    {
      type: "square",
      color: "bg-cyan-400",
      size: 20,
      top: "25%",
      left: "85%",
      rotate: "45deg",
    },
    {
      type: "square",
      color: "bg-yellow-400",
      size: 18,
      top: "82%",
      left: "15%",
      rotate: "15deg",
    },
    {
      type: "triangle",
      color: "bg-pink-500",
      size: 24,
      top: "48%",
      left: "8%",
    },
    { type: "dots", color: "text-black", top: "15%", left: "65%" },
    { type: "dots", color: "text-black", top: "65%", left: "12%" },
  ];

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
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => {
              setIsPartyPressed(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onPressOut={() => setIsPartyPressed(false)}
            onPress={handleSelectPartyMode}
            className="w-full mb-6"
          >
            <View style={{ height: 160, position: "relative" }}>
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 24, top: 8, left: 8 },
                ]}
                className="bg-black"
              />
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    borderRadius: 24,
                    borderWidth: 4,
                    borderTopWidth: isPartyPressed ? 8 : 4,
                    borderLeftWidth: isPartyPressed ? 8 : 4,
                    borderColor: "#000000",
                    padding: 20,
                    justifyContent: "space-between",
                    transform: [
                      { translateY: isPartyPressed ? 4 : 0 },
                      { translateX: isPartyPressed ? 4 : 0 },
                    ],
                  },
                ]}
                className="bg-cyan-300"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-3xl font-black text-black tracking-tight">
                    PARTY MODE
                  </Text>
                  <Text className="text-3xl font-black">🎉</Text>
                </View>
                <Text className="text-base font-bold text-black/80">
                  ALL AGES & SOBER FRIENDLY. Games, trivia, and group fun!
                </Text>
                <View className="bg-white border-2 border-black rounded-xl py-2 px-4 self-end">
                  <Text className="font-black text-black">START PLAYING →</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Drinking Mode */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => {
              setIsDrinkingPressed(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onPressOut={() => setIsDrinkingPressed(false)}
            onPress={handleSelectDrinkingMode}
            className="w-full"
          >
            <View style={{ height: 160, position: "relative" }}>
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 24, top: 8, left: 8 },
                ]}
                className="bg-black"
              />
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    borderRadius: 24,
                    borderWidth: 4,
                    borderTopWidth: isDrinkingPressed ? 8 : 4,
                    borderLeftWidth: isDrinkingPressed ? 8 : 4,
                    borderColor: "#000000",
                    padding: 20,
                    justifyContent: "space-between",
                    transform: [
                      { translateY: isDrinkingPressed ? 4 : 0 },
                      { translateX: isDrinkingPressed ? 4 : 0 },
                    ],
                  },
                ]}
                className="bg-pink-400"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-3xl font-black text-black tracking-tight">
                    DRINKING MODE
                  </Text>
                  <Text className="text-3xl font-black">🍺</Text>
                </View>
                <Text className="text-base font-bold text-black/80">
                  21+ ONLY. High-energy drinking challenges & group icebreakers.
                </Text>
                <View className="bg-white border-2 border-black rounded-xl py-2 px-4 self-end">
                  <Text className="font-black text-black">START PLAYING →</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {step === "keypad" && (
        <Animated.View
          style={{
            transform: [{ translateX: shakeAnim }],
            width: "100%",
            maxWidth: 320,
            position: "relative",
          }}
        >
          {/* Card Shadow */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: 24, top: 8, left: 8 },
            ]}
            className="bg-black"
          />

          {/* Card Body */}
          <View
            style={{
              borderRadius: 24,
              borderWidth: 4,
              borderColor: "#000000",
              padding: 20,
              backgroundColor: "#fdf6e2",
            }}
          >
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStep("select");
                setYearStr("");
              }}
              style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}
            >
              <View className="bg-white border-2 border-black rounded-lg px-2 py-1 flex-row items-center">
                <Text className="font-black text-xs text-black">◀ BACK</Text>
              </View>
            </TouchableOpacity>

            <Text className="text-3xl font-black text-black text-center mt-6 mb-2 tracking-tight">
              VERIFY AGE
            </Text>
            <Text className="text-xs font-black text-black/60 text-center uppercase tracking-widest mb-4">
              ENTER BIRTH YEAR
            </Text>

            {/* Display Input Box */}
            <TouchableWithoutFeedback onPress={handleClear}>
              <View
                style={{ position: "relative", height: 60, marginBottom: 16 }}
              >
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { borderRadius: 12, top: 3, left: 3 },
                  ]}
                  className="bg-black"
                />
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      borderRadius: 12,
                      borderWidth: 3,
                      borderColor: "#000000",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                  className="bg-yellow-400"
                >
                  <Text className="text-3xl font-black text-black tracking-[0.2em]">
                    {yearStr ? yearStr.padEnd(4, "_") : "____"}
                  </Text>
                  {yearStr.length > 0 && (
                    <Text
                      style={{
                        position: "absolute",
                        right: 10,
                        fontSize: 10,
                        fontWeight: "900",
                        color: "rgba(0,0,0,0.5)",
                      }}
                    >
                      TAP TO CLEAR
                    </Text>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>

            {/* Keypad Grid */}
            <View>
              <View className="flex-row justify-between">
                <KeyButton label="1" onPress={() => handleKeyPress("1")} />
                <KeyButton label="2" onPress={() => handleKeyPress("2")} />
                <KeyButton label="3" onPress={() => handleKeyPress("3")} />
              </View>
              <View className="flex-row justify-between">
                <KeyButton label="4" onPress={() => handleKeyPress("4")} />
                <KeyButton label="5" onPress={() => handleKeyPress("5")} />
                <KeyButton label="6" onPress={() => handleKeyPress("6")} />
              </View>
              <View className="flex-row justify-between">
                <KeyButton label="7" onPress={() => handleKeyPress("7")} />
                <KeyButton label="8" onPress={() => handleKeyPress("8")} />
                <KeyButton label="9" onPress={() => handleKeyPress("9")} />
              </View>
              <View className="flex-row justify-between">
                <KeyButton label="0" onPress={() => handleKeyPress("0")} />
                <KeyButton
                  label={isVerifying ? "..." : "SUBMIT"}
                  onPress={handleSubmit}
                  flexSpan={2}
                  colorClass={
                    yearStr.length === 4 ? "bg-emerald-400" : "bg-gray-300"
                  }
                  disabled={isVerifying}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {step === "denied" && (
        <View className="w-full max-w-sm items-center">
          <View style={{ width: "100%", position: "relative" }}>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { borderRadius: 24, top: 8, left: 8 },
              ]}
              className="bg-black"
            />
            <View
              style={{
                borderRadius: 24,
                borderWidth: 4,
                borderColor: "#000000",
                padding: 24,
                backgroundColor: "#fee2e2",
                alignItems: "center",
              }}
            >
              <Text className="text-6xl mb-4 font-black">🛑</Text>
              <Text className="text-3xl font-black text-red-600 text-center mb-2 uppercase tracking-tight">
                ACCESS DENIED
              </Text>
              <Text className="text-center font-bold text-black/80 mb-6 text-sm">
                You must be 21 or older to enter Drinking Mode. Try our
                high-energy Party Mode instead!
              </Text>

              {/* Action Buttons */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleGoToPartyMode}
                className="w-full mb-3"
              >
                <View style={{ height: 56, position: "relative" }}>
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      { borderRadius: 16, top: 3, left: 3 },
                    ]}
                    className="bg-black"
                  />
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        borderRadius: 16,
                        borderWidth: 3,
                        borderColor: "#000000",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                    className="bg-cyan-300"
                  >
                    <Text className="text-base font-black text-black">
                      PLAY PARTY MODE →
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={1}
                onPress={handleRetry}
                className="w-full"
              >
                <View style={{ height: 56, position: "relative" }}>
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      { borderRadius: 16, top: 3, left: 3 },
                    ]}
                    className="bg-black"
                  />
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        borderRadius: 16,
                        borderWidth: 3,
                        borderColor: "#000000",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                    className="bg-white"
                  >
                    <Text className="text-base font-black text-black">
                      TRY ANOTHER YEAR
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
