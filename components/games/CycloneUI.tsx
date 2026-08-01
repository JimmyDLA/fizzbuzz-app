import {
  playButtonClickSound,
  playWhooshSound,
  stopWhooshSound,
} from "@/utils/sound";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useGameData } from "./useGameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const NUM_LIGHTS = 50;
const SPEED_MS = 1500; // ms per full rotation
const TARGET_INDEX = 0; // Top dead center
const ARC = (Math.PI * 2) / NUM_LIGHTS;
const CENTER_Y = SCREEN_WIDTH * 0.55;
const CENTER_X = SCREEN_WIDTH * 0.5;
const RADIUS = SCREEN_WIDTH * 0.38;

interface BulbProps {
  index: number;
  activeIndex: SharedValue<number>;
  stoppedIndex: number | null;
  isDark: boolean;
}

// Bulb component for performance isolation
const Bulb = ({ index, activeIndex, stoppedIndex, isDark }: BulbProps) => {
  const angle = index * ARC - Math.PI / 2; // Start at top
  const cx = CENTER_X + RADIUS * Math.cos(angle);
  const cy = CENTER_Y + RADIUS * Math.sin(angle);

  const isTarget = index === TARGET_INDEX;

  const style = useAnimatedStyle(() => {
    let color = isTarget ? "#3B82F6" : "#334155"; // Default inactive (yellow target, gray others)
    let scale = 1;

    // Use stopped index if the player hit stop, otherwise use the live spinning index
    const currentActive =
      stoppedIndex !== null
        ? stoppedIndex
        : Math.floor(activeIndex.value) % NUM_LIGHTS;

    if (currentActive === index) {
      color = isTarget ? "#59ff00ff" : "#FCD34D"; // Green if stopped on target, Blue otherwise
      scale = 1.2;
    }

    return {
      backgroundColor: color,
      transform: [{ scale }],
      shadowColor: color,
      shadowOpacity: currentActive === index ? 0.9 : 0,
      shadowRadius: 12,
    };
  });

  return (
    <Animated.View
      style={[
        styles.bulb,
        {
          left: cx - 8,
          top: cy - 8,
          borderWidth: 2,
          borderColor: isDark ? "#ffffff" : "#000000",
        },
        style,
      ]}
    />
  );
};

export function CycloneUI() {
  const { myPlayer, sendAction } = useGameData();
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const activeIndex = useSharedValue(0);
  const [localStop, setLocalStop] = useState<number | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) {}

  useEffect(() => {
    // Start spinning
    activeIndex.value = 0;
    activeIndex.value = withRepeat(
      withTiming(NUM_LIGHTS, { duration: SPEED_MS, easing: Easing.linear }),
      -1,
      false,
    );
    playWhooshSound();

    return () => {
      cancelAnimation(activeIndex);
      stopWhooshSound();
    };
  }, []);

  // When game finishes (server timeout or all stopped), hardcode to stoppedIndex if it wasn't captured locally
  useEffect(() => {
    if (gameData.finished) {
      stopWhooshSound();
      if (localStop === null && gameData.stoppedIndex !== null) {
        setLocalStop(gameData.stoppedIndex);
      }
    }
  }, [gameData.finished, gameData.stoppedIndex, localStop]);

  const handleStop = () => {
    if (localStop !== null || gameData.finished) return; // Already stopped
    playButtonClickSound();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stopWhooshSound();

    // Capture precise visually rendered index
    const currentIndex = Math.floor(activeIndex.value) % NUM_LIGHTS;
    cancelAnimation(activeIndex);
    activeIndex.value = currentIndex; // Freeze
    setLocalStop(currentIndex);

    sendAction({ action: "stop", index: currentIndex });
  };

  const bulbs = [];
  for (let i = 0; i < NUM_LIGHTS; i++) {
    bulbs.push(
      <Bulb
        key={i}
        index={i}
        activeIndex={activeIndex}
        stoppedIndex={localStop}
        isDark={isDark}
      />,
    );
  }
  //   const msg = message.toUpperCase();
  //   if (
  //     msg.includes("WIN") ||
  //     msg.includes("BULLSEYE") ||
  //     msg.includes("CLOSEST")
  //   ) {
  //     return "bg-emerald-400";
  //   }
  //   if (msg.includes("WAITING")) {
  //     return "bg-yellow-300";
  //   }
  //   return "bg-red-400";
  // };

  const isDisabled = localStop !== null || gameData.finished;
  const translateOffset = !isDisabled && !isPressed ? -5 : 0;

  return (
    <View
      style={styles.container}
      className={isDark ? "bg-zinc-950" : "bg-green-500"}
    >
      <View style={styles.gameArea}>
        {/* Downward pointing arrow to target bullseye bulb */}
        <Text
          style={{
            position: "absolute",
            left: CENTER_X - 25,
            top: CENTER_Y - RADIUS - 45,
            width: 50,
            textAlign: "center",
            fontSize: 36,
            color: isDark ? "#ffffff" : "#000000",
            fontWeight: "900",
          }}
        >
          ▼
        </Text>

        {bulbs}

        {/* STOP Button with physical shadow backing */}
        <View style={styles.stopButtonWrapper}>
          {/* Shadow */}
          <View
            style={[StyleSheet.absoluteFillObject, { borderRadius: 50 }]}
            className={isDark ? "bg-white" : "bg-black"}
          />
          {/* Button Face */}
          <TouchableOpacity
            activeOpacity={1}
            delayPressIn={0}
            onPressIn={() => {
              if (!isDisabled) setIsPressed(true);
            }}
            onPressOut={() => setIsPressed(false)}
            onPress={handleStop}
            disabled={isDisabled}
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: 50,
                borderWidth: 4,
                borderColor: isDark ? "#ffffff" : "#000000",
                justifyContent: "center",
                alignItems: "center",
                transform: [
                  { translateY: translateOffset },
                  { translateX: translateOffset },
                ],
              },
            ]}
            className={
              isDisabled
                ? isDark
                  ? "bg-zinc-700 opacity-50"
                  : "bg-zinc-300 opacity-50"
                : "bg-red-500"
            }
          >
            <Text className="text-black font-black text-xl tracking-widest uppercase">
              STOP
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gameArea: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.1,
    position: "relative",
  },
  bulb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stopButtonWrapper: {
    position: "absolute",
    top: CENTER_Y - 50,
    left: CENTER_X - 50,
    width: 100,
    height: 100,
  },
  resultBannerWrapper: {
    position: "absolute",
    bottom: 50,
    width: "85%",
  },
});
