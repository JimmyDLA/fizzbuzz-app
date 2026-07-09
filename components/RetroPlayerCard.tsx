import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RetroPlayerCardProps {
  name: string;
  isMe: boolean;
  isHost: boolean;
  rank?: number;
  score?: number;
  isReady?: boolean;
}

export function RetroPlayerCard({
  name,
  isMe,
  isHost,
  rank,
  score,
  isReady,
}: RetroPlayerCardProps) {
  const cardColorClass = isMe ? "bg-cyan-300" : "bg-white";
  const avatarBgClass = isMe ? "bg-yellow-400" : "bg-pink-300";

  return (
    <View className="w-full relative mb-4">
      {/* Behind Shadow */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: 20, top: 4, left: 4 },
        ]}
        className="bg-black"
      />

      {/* Card Body */}
      <View
        style={{
          borderRadius: 20,
          borderWidth: 3,
          borderColor: "#000000",
          padding: 14,
        }}
        className={`flex-row items-center justify-between ${cardColorClass}`}
      >
        <View className="flex-row items-center flex-1">
          {/* Rank Prefix */}
          {rank !== undefined && (
            <Text
              className="text-black font-black text-3xl mr-3"
              style={{
                textShadowColor: "#facc15",
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
            className="text-2xl font-black text-black flex-1"
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
          <View
            style={{
              borderWidth: 2,
              borderColor: "#000000",
              borderRadius: 12,
            }}
            className="flex-row items-center bg-yellow-400 px-3 py-1.5 ml-2 shadow-[2px_2px_0px_0px_#000]"
          >
            <View className="w-5 h-7 bg-yellow-200 rounded-[8px] border-2 border-black items-center justify-center mr-2">
              <View className="w-1 h-3.5 bg-black rounded-full" />
            </View>
            <Text className="text-black font-black text-xl">{score}</Text>
          </View>
        )}

        {/* Ready Status Indicator */}
        {isReady !== undefined && (
          <View
            style={{ borderWidth: 2, borderColor: "#000000", borderRadius: 10 }}
            className={`px-3 py-1.5 ml-2 ${isReady ? "bg-emerald-400" : "bg-pink-400"}`}
          >
            <Text className="text-black font-black text-sm">
              {isReady ? "READY" : "WAIT"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
