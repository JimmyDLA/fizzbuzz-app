import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export function DynamicGameResults({ rawData }: { rawData: string }) {
  if (!rawData) return null;

  let data: any;
  try {
    data = JSON.parse(rawData);
  } catch (e) {
    return null;
  }

  const renderLeaderboard = () => {
    return (
      <View className="w-full bg-black/40 rounded-[32px] border-4 border-white/20 p-4 mb-6 shadow-xl">
        <Text className="text-indigo-200 text-xl font-black mb-4 text-center uppercase tracking-[0.2em]">{data.title}</Text>
        <View className="flex-col gap-3">
          {data.leaderboard?.map((item: any, idx: number) => (
            <View key={item.playerId} className={`flex-row justify-between items-center px-5 py-3 rounded-[24px] border-4 ${item.isWinner ? 'bg-emerald-600/90 border-emerald-400' : 'bg-white/10 border-white/10'}`}>
              <View className="flex-row items-center flex-1">
                <Text className={`font-black text-xl w-10 ${item.isWinner ? 'text-emerald-100' : 'text-white/30'}`}>{idx + 1}</Text>
                <Text className={`font-black text-xl uppercase flex-1 ${item.isWinner ? 'text-white' : 'text-slate-300'}`} numberOfLines={1}>{item.playerName}</Text>
              </View>
              <Text className={`font-black text-lg tracking-wider ml-2 ${item.isWinner ? 'text-yellow-300' : 'text-slate-400'}`}>{item.scoreLabel}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTimeline = () => {
    return (
      <View className="w-full bg-black/40 rounded-[32px] border-4 border-white/20 p-4 mb-6 shadow-xl">
        <Text className="text-indigo-200 text-xl font-black mb-4 text-center uppercase tracking-[0.2em]">{data.title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-col gap-3">
            {data.timeline?.map((item: any) => (
              <View key={item.playerId} className={`flex-row items-center px-4 py-3 rounded-2xl border-4 ${item.isWinner ? 'bg-emerald-600/40 border-emerald-500/50' : 'bg-white/5 border-white/5'}`}>
                <Text className={`font-black text-lg uppercase w-24 ${item.isWinner ? 'text-emerald-300' : 'text-slate-400'}`} numberOfLines={1}>{item.playerName}</Text>
                <View className="flex-row gap-2">
                  {item.events.map((ev: any, eIdx: number) => (
                    <View key={eIdx} className={`w-12 h-14 rounded-xl border-[3px] items-center justify-center ${ev.success ? 'bg-emerald-500/80 border-emerald-300' : 'bg-red-500/80 border-red-300'}`}>
                      <Text className="text-white font-black text-[10px] opacity-60 mb-1">{ev.label}</Text>
                      <Text className="text-white font-black text-xl">{ev.success ? '✓' : '✗'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  switch (data.type) {
    case 'leaderboard':
    case 'elimination':
      return renderLeaderboard();
    case 'timeline':
      return renderTimeline();
    default:
      return null;
  }
}
