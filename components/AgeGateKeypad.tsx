import * as Haptics from "expo-haptics";
import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { KeyButton } from "./KeyButton";

interface AgeGateKeypadProps {
  yearStr: string;
  isVerifying: boolean;
  shakeAnim: Animated.Value;
  onKeyPress: (num: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function AgeGateKeypad({
  yearStr,
  isVerifying,
  shakeAnim,
  onKeyPress,
  onClear,
  onSubmit,
  onBack,
}: AgeGateKeypadProps) {
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  return (
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
        className={isDark ? "bg-white" : "bg-black"}
      />

      {/* Card Body */}
      <View
        style={{
          borderRadius: 24,
          borderWidth: 4,
          borderColor: isDark ? "#ffffff" : "#000000",
          padding: 20,
          backgroundColor: isDark ? "#18181b" : "#fdf6e2",
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onBack();
          }}
          style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}
        >
          <View className={`${isDark ? "bg-zinc-800 border-white" : "bg-white border-black"} border-2 rounded-lg px-2 py-1 flex-row items-center`}>
            <Text className={`font-black text-xs ${isDark ? "text-white" : "text-black"}`}>◀ BACK</Text>
          </View>
        </TouchableOpacity>

        <Text className={`text-3xl font-black ${isDark ? "text-white" : "text-black"} text-center mt-6 mb-2 tracking-tight`}>
          VERIFY AGE
        </Text>
        <Text className={`text-xs font-black ${isDark ? "text-white/60" : "text-black/60"} text-center uppercase tracking-widest mb-4`}>
          ENTER BIRTH YEAR
        </Text>

        {/* Display Input Box */}
        <TouchableWithoutFeedback onPress={onClear}>
          <View style={{ position: "relative", height: 60, marginBottom: 16 }}>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { borderRadius: 12, top: 3, left: 3 },
              ]}
              className={isDark ? "bg-white" : "bg-black"}
            />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius: 12,
                  borderWidth: 3,
                  borderColor: isDark ? "#ffffff" : "#000000",
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
            <KeyButton label="1" onPress={() => onKeyPress("1")} />
            <KeyButton label="2" onPress={() => onKeyPress("2")} />
            <KeyButton label="3" onPress={() => onKeyPress("3")} />
          </View>
          <View className="flex-row justify-between">
            <KeyButton label="4" onPress={() => onKeyPress("4")} />
            <KeyButton label="5" onPress={() => onKeyPress("5")} />
            <KeyButton label="6" onPress={() => onKeyPress("6")} />
          </View>
          <View className="flex-row justify-between">
            <KeyButton label="7" onPress={() => onKeyPress("7")} />
            <KeyButton label="8" onPress={() => onKeyPress("8")} />
            <KeyButton label="9" onPress={() => onKeyPress("9")} />
          </View>
          <View className="flex-row justify-between">
            <KeyButton label="0" onPress={() => onKeyPress("0")} />
            <KeyButton
              label={isVerifying ? "..." : "SUBMIT"}
              onPress={onSubmit}
              flexSpan={2}
              colorClass={
                yearStr.length === 4
                  ? "bg-emerald-400"
                  : (isDark ? "bg-zinc-700" : "bg-gray-300")
              }
              disabled={isVerifying}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
