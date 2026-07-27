import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

export function DynamicGameResults({ rawData }: { rawData: string }) {
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  if (!rawData) return null;

  let data: any;
  try {
    data = JSON.parse(rawData);
  } catch (e) {
    return null;
  }

  const renderLeaderboard = () => {
    return (
      <View className="w-full">
        <Text
          className={`font-black text-lg mb-4 text-center uppercase tracking-widest ${isDark ? "text-zinc-400" : "text-black"}`}
        >
          {data.title}
        </Text>
        <View className="flex-col gap-3 ">
          {data.leaderboard?.map((item: any, idx: number) => {
            const containerClass = item.isWinner
              ? isDark
                ? "bg-emerald-600/90 border-2 border-emerald-400"
                : "bg-emerald-400 border-2 border-black"
              : isDark
                ? "bg-zinc-950 border-2 border-zinc-800"
                : "bg-white border-2 border-black";

            const numClass = item.isWinner
              ? isDark
                ? "text-emerald-100"
                : "text-black"
              : isDark
                ? "text-white/30"
                : "text-zinc-400";

            const nameClass = item.isWinner
              ? isDark
                ? "text-white"
                : "text-black"
              : isDark
                ? "text-slate-300"
                : "text-black";

            const labelClass = item.isWinner
              ? isDark
                ? "text-yellow-300"
                : "text-black"
              : isDark
                ? "text-slate-400"
                : "text-zinc-500";

            return (
              <View
                key={item.playerId}
                className={`flex-row justify-between items-center px-5 py-3 rounded-[24px] border-3 ${containerClass}`}
              >
                <View className="flex-row items-center flex-1 pr-4">
                  <Text className={`font-black text-xl w-8 ${numClass}`}>
                    {idx + 1}
                  </Text>
                  <Text
                    className={`font-black text-lg uppercase flex-1 ${nameClass}`}
                    numberOfLines={1}
                  >
                    {item.playerName}
                  </Text>
                </View>
                <View className="items-end justify-center max-w-[50%] shrink-0">
                  <Text
                    className={`font-black text-xs tracking-wider text-right ${labelClass}`}
                    numberOfLines={2}
                  >
                    {item.scoreLabel}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTimeline = () => {
    return (
      <View className="w-full">
        <Text
          className={`font-black text-lg mb-4 text-center uppercase tracking-widest ${isDark ? "text-zinc-400" : "text-black"}`}
        >
          {data.title}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-col w-[100%]"
        >
          <View className="flex-col w-[100%] gap-3">
            {data.timeline?.map((item: any) => {
              const containerClass = item.isWinner
                ? isDark
                  ? "bg-emerald-600/40 border-2 border-emerald-500/50"
                  : "bg-emerald-400 border-2 border-black"
                : isDark
                  ? "bg-zinc-950 border-2 border-zinc-800"
                  : "bg-white border-2 border-black";

              const nameClass = item.isWinner
                ? isDark
                  ? "text-emerald-300"
                  : "text-black"
                : isDark
                  ? "text-slate-400"
                  : "text-black";

              return (
                <View
                  key={item.playerId}
                  className={`w-[100%] justify-items-start px-4 py-3 rounded-2xl border-3 ${containerClass}`}
                >
                  <Text
                    className={`font-black text-sm uppercase w-24 mb-2 ${nameClass}`}
                    numberOfLines={1}
                  >
                    {item.playerName}
                  </Text>
                  <View className="flex-row gap-2">
                    {item.events.map((ev: any, eIdx: number) => (
                      <View
                        key={eIdx}
                        className={`w-10 h-12 rounded-xl border-2 items-center justify-center ${ev.success ? "bg-emerald-500 border-black" : "bg-red-400 border-black"}`}
                      >
                        <Text className="text-black font-black text-[9px] mb-1">
                          {ev.label}
                        </Text>
                        <Text className="text-black font-black text-[10px]">
                          {ev.success ? "✓" : "✗"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  switch (data.type) {
    case "leaderboard":
    case "elimination":
      return renderLeaderboard();
    case "timeline":
      return renderTimeline();
    default:
      return null;
  }
}
