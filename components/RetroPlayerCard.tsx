import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { playCoinDropSound } from "../utils/sound";

interface RetroPlayerCardProps {
  name: string;
  isMe: boolean;
  isHost: boolean;
  rank?: number;
  score?: number;
  isReady?: boolean;
  triggerAnimationKey?: number;
  isWinner?: boolean;
}

export function RetroPlayerCard({
  name,
  isMe,
  isHost,
  rank,
  score,
  isReady,
  triggerAnimationKey,
  isWinner,
}: RetroPlayerCardProps) {
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const isWinnerOfLastGame = !!isWinner && score !== undefined;
  const previousScore = isWinnerOfLastGame
    ? Math.max(0, score - 3)
    : (score ?? 0);

  const [hasCompletedAnimation, setHasCompletedAnimation] = useState(false);
  const [displayScore, setDisplayScore] = useState(previousScore);
  const [testKey, setTestKey] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastProcessedKeyRef = useRef<number>(0);

  const triggerPop = () => {
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.35,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (triggerAnimationKey === undefined || triggerAnimationKey === 0) {
      setHasCompletedAnimation(false);
      lastProcessedKeyRef.current = 0;
      if (isWinnerOfLastGame) {
        setDisplayScore(previousScore);
      } else {
        setDisplayScore(score ?? 0);
      }
      return;
    }

    if (
      isWinnerOfLastGame &&
      triggerAnimationKey > 0 &&
      lastProcessedKeyRef.current !== triggerAnimationKey
    ) {
      lastProcessedKeyRef.current = triggerAnimationKey;
      const baseScore = Math.max(0, score - 3);
      setDisplayScore(baseScore);
      setHasCompletedAnimation(false);

      // Staggered count up matching Coin 1, Coin 2, Coin 3 impacts (200ms, 450ms, 700ms)
      const t1 = setTimeout(() => {
        setDisplayScore(Math.max(0, score - 2));
        triggerPop();
        playCoinDropSound();
      }, 200);

      const t2 = setTimeout(() => {
        setDisplayScore(Math.max(0, score - 1));
        triggerPop();
      }, 450);

      const t3 = setTimeout(() => {
        setDisplayScore(score);
        triggerPop();
        setHasCompletedAnimation(true);
      }, 700);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else if (isWinnerOfLastGame && !hasCompletedAnimation) {
      setDisplayScore(previousScore);
    } else {
      setDisplayScore(score ?? 0);
    }
  }, [triggerAnimationKey, score, isWinnerOfLastGame, previousScore]);

  const cardColorClass = isMe
    ? isDark
      ? "bg-cyan-500"
      : "bg-cyan-300"
    : isDark
      ? "bg-zinc-800"
      : "bg-white";

  const avatarBgClass = isMe
    ? isDark
      ? "bg-yellow-500"
      : "bg-yellow-400"
    : isDark
      ? "bg-pink-500"
      : "bg-pink-300";

  const nameColorClass = isMe
    ? "text-black"
    : isDark
      ? "text-white"
      : "text-black";

  const rankTextColorClass = isDark ? "text-white" : "text-black";

  return (
    <View className="w-full relative mb-4">
      {/* Behind Shadow */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: 20, top: 4, left: 4 },
        ]}
        className={isDark ? "bg-white" : "bg-black"}
      />

      {/* Card Body */}
      <View
        style={{
          borderRadius: 20,
          borderWidth: 3,
          borderColor: isDark ? "#ffffff" : "#000000",
          padding: 14,
        }}
        className={`flex-row items-center justify-between ${cardColorClass}`}
      >
        <View className="flex-row items-center flex-1">
          {/* Rank Prefix */}
          {rank !== undefined && (
            <Text
              className={`${rankTextColorClass} font-black text-3xl mr-3`}
              style={{
                textShadowColor: isDark ? "#06b6d4" : "#facc15",
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 0,
              }}
            >
              #{rank}
            </Text>
          )}

          {/* Initials Avatar */}
          <View
            className={`w-12 h-12 rounded-full border-2 border-black items-center justify-center mr-3 ${avatarBgClass}`}
          >
            <Text className="text-2xl font-black text-black">
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Player Name */}
          <Text
            className={`text-2xl font-black ${nameColorClass} flex-1`}
            numberOfLines={1}
          >
            {name}
          </Text>

          {/* Host Indicator */}
          {isHost && (
            <View className="ml-2 bg-green-400 px-2 py-0.5 border-2 border-black rounded-lg">
              <Text className="text-[10px] font-black text-black">HOST</Text>
            </View>
          )}
        </View>

        {/* Score Indicator */}
        {score !== undefined && (
          <Animated.View
            style={{
              borderWidth: 2,
              borderColor: isDark ? "#ffffff" : "#000000",
              borderRadius: 12,
              position: "relative",
              transform: [{ scale: scaleAnim }],
            }}
            className="flex-row items-center bg-blue-400 px-3 py-1.5 ml-2 shadow-[2px_2px_0px_0px_#000]"
          >
            <View className="w-5 h-7 bg-yellow-200 rounded-[8px] border-2 border-black items-center justify-center mr-2">
              <View className="w-1 h-3.5 bg-black rounded-full" />
            </View>
            <Text className="text-black font-black text-xl">
              {displayScore}
            </Text>

            {((triggerAnimationKey !== undefined && triggerAnimationKey > 0) ||
              testKey > 0) && (
              <LottieView
                key={`${triggerAnimationKey || 0}-${testKey}`}
                source={require("../assets/images/coins_animation.json")}
                autoPlay
                loop={false}
                style={{
                  position: "absolute",
                  width: 80,
                  height: 80,
                  left: -21,
                  top: -23,
                  pointerEvents: "none",
                }}
              />
            )}
          </Animated.View>
        )}

        {/* Ready Status Indicator */}
        {isReady !== undefined && (
          <View
            style={{
              borderWidth: 2,
              borderColor: isDark ? "#ffffff" : "#000000",
              borderRadius: 10,
            }}
            className={`px-3 py-1.5 ml-2 ${
              isReady ? "bg-emerald-400" : "bg-zinc-300"
            }`}
          >
            <Text className="text-black font-black text-xs uppercase">
              {isReady ? "READY" : "WAITING"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
