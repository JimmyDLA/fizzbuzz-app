import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useGameData } from "./useGameData";

export function HotPotatoUI() {
  const { players, selectedPlayers, timer, myPlayer, sendAction, isPractice } =
    useGameData();
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";
  const [isPressed, setIsPressed] = useState(false);

  // Local state for Practice Mode
  const [localAmIHolder, setLocalAmIHolder] = useState(true);
  const passTimeoutRef = useRef<any>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (passTimeoutRef.current) {
        clearTimeout(passTimeoutRef.current);
      }
    };
  }, []);

  // Stop pending pass timeouts if game timer ends
  useEffect(() => {
    if (timer <= 0 && passTimeoutRef.current) {
      clearTimeout(passTimeoutRef.current);
    }
  }, [timer]);

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) {}

  const amIHolder = isPractice ? localAmIHolder : gameData.potatoHolderId === myPlayer?.id;
  const holderPlayer = players.find(
    (p: any) => p.id === gameData.potatoHolderId,
  );
  const holderName = isPractice
    ? (amIHolder ? "YOU" : "COMPUTER")
    : (holderPlayer?.name ?? "Someone");

  // Simple pulsing scale animation for the potato
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (amIHolder) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 200,
            easing: Easing.quad,
            useNativeDriver: true,
          }),
          RNAnimated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.quad,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
    }
  }, [amIHolder]);

  const handlePass = () => {
    if (isPractice) {
      if (!localAmIHolder || timer <= 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLocalAmIHolder(false);

      // Random delay between 1 and 3 seconds
      const randomDelay = Math.floor(Math.random() * 2000) + 1000;
      passTimeoutRef.current = setTimeout(() => {
        setLocalAmIHolder(true);
      }, randomDelay);
    } else {
      if (!amIHolder) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      sendAction({ action: "pass" });
    }
  };

  return (
    <View className="flex-1 items-center justify-center pt-2 w-full px-6">
      {amIHolder ? (
        <Text
          className="text-red-500 text-5xl font-black mb-8 text-center uppercase tracking-widest"
          style={{
            textShadowColor: isDark ? "#ffffff" : "#000000",
            textShadowOffset: { width: 3, height: 3 },
            textShadowRadius: 0,
          }}
        >
          {timer <= 0 ? "YOU LOSE!" : "PASS IT!"}
        </Text>
      ) : (
        <Text
          className={`text-3xl font-black mb-8 text-center uppercase tracking-widest ${isDark ? "text-white" : "text-black"}`}
          style={{
            textShadowColor: isDark ? "#ec4899" : "#facc15",
            textShadowOffset: { width: 3, height: 3 },
            textShadowRadius: 0,
          }}
        >
          {holderName} HAS IT!
        </Text>
      )}

      {/* Main Potato/Waiting Container */}
      <View style={styles.potatoWrapper} className="mb-10">
        {amIHolder ? (
          <View style={StyleSheet.absoluteFillObject}>
            {/* Shadow Backing */}
            <View
              style={[StyleSheet.absoluteFillObject, { borderRadius: 100 }]}
              className={isDark ? "bg-white" : "bg-black"}
            />

            {/* Button Body */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => {
                if (timer > 0) setIsPressed(true);
              }}
              onPressOut={() => setIsPressed(false)}
              onPress={handlePass}
              disabled={timer <= 0}
              style={{ width: "100%", height: "100%" }}
            >
              <RNAnimated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    borderRadius: 100,
                    borderWidth: 14,
                    borderColor: isDark ? "#ffffff" : "#451a03",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [
                      { scale: scaleAnim },
                      { translateY: !isPressed ? -8 : 0 },
                      { translateX: !isPressed ? -8 : 0 },
                    ],
                  },
                ]}
                className={
                  timer <= 0 ? "bg-zinc-600 opacity-50" : "bg-orange-800"
                }
              >
                <Text className="text-white font-black text-4xl opacity-50 uppercase tracking-widest text-center">
                  POTATO
                </Text>
              </RNAnimated.View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={StyleSheet.absoluteFillObject}>
            {/* Waiting Placeholder */}
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 100,
                borderWidth: 4,
                borderColor: isDark ? "#ffffff" : "#000000",
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
              }}
              className={isDark ? "bg-zinc-900" : "bg-zinc-100"}
            >
              <Text className="text-zinc-500 font-black text-2xl uppercase tracking-widest text-center">
                Waiting...
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  potatoWrapper: {
    width: 240,
    height: 300,
    position: "relative",
  },
  opponentCardWrapper: {
    width: "45%",
    minWidth: 120,
    position: "relative",
    marginBottom: 8,
  },
});
