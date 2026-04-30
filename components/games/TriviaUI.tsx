import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';

export function TriviaUI() {
  const { players, playerName } = useSelector((state: any) => state.lobby);
  const myPlayer = players.find((p: any) => p.name === playerName);

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) { }

  const handleAnswer = (ans: string) => {
    colyseusService.sendGameAction({ action: 'answer', answer: ans });
  };

  const colors = [
    { bg: 'bg-rose-500', border: 'border-rose-700' },
    { bg: 'bg-indigo-500', border: 'border-indigo-700' },
    { bg: 'bg-amber-500', border: 'border-amber-700' },
    { bg: 'bg-emerald-500', border: 'border-emerald-700' },
  ];

  return (
    <View className="flex-1 items-center pt-2 w-full px-2">
      <Text className="text-white text-2xl font-black mb-4 text-center opacity-80 uppercase tracking-widest shadow-sm">
        TRIVIA RACE! ({gameData.index + 1 || 0}/{gameData.total || 10})
      </Text>

      <View className="bg-white/20 p-6 rounded-[40px] border-[6px] border-white/40 mb-8 shadow-2xl w-full items-center min-h-[140px] justify-center overflow-hidden">
        <View className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
        <Text className="text-white text-3xl font-black text-center leading-tight px-2" style={{ textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>
          {gameData.question || 'Fetching next question...'}
        </Text>
      </View>

      <ScrollView className="w-full flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="w-full gap-4">
          {gameData.options?.map((opt: string, idx: number) => {
            const isLocked = gameData.isLockedOut;
            const color = colors[idx % colors.length];
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => handleAnswer(opt)}
                disabled={isLocked || gameData.isTransitioning}
                className={`${isLocked ? 'bg-slate-700 border-slate-900 opacity-50' : color.bg} border-b-[10px] ${isLocked ? 'border-slate-900' : color.border} py-6 rounded-[32px] items-center justify-center shadow-2xl px-6 min-h-[80px]`}
              >
                <Text className="text-white text-2xl font-black text-center tracking-tight" numberOfLines={2}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {gameData.isLockedOut && !gameData.isTransitioning && (
          <Text className="text-red-400 font-black text-xl mt-6 tracking-widest text-center uppercase shadow-sm">Waiting for someone to get it right...</Text>
        )}
      </ScrollView>

      <View className="mt-4 bg-indigo-900/60 px-8 py-3 rounded-full border-4 border-white/30 shadow-lg flex-row items-center">
        <View className="w-4 h-6 bg-yellow-300 rounded-[8px] border-2 border-orange-500 items-center justify-center mr-3 shadow-sm">
          <View className="w-[2px] h-3 bg-orange-500 rounded-full opacity-80" />
        </View>
        <Text className="text-yellow-400 font-black text-2xl uppercase tracking-[0.2em]">SCORE: {myPlayer?.gameScore || 0}</Text>
      </View>

      {gameData.isTransitioning && (
        <View className="absolute z-50 bottom-20 left-2 w-full h-full justify-center items-center p-4 bg-black/60 rounded-3xl">
          <View className="bg-slate-900 border-[8px] border-emerald-500 py-10 px-6 rounded-[48px] shadow-2xl w-full items-center pb-12 shadow-emerald-500/20">
            <Text className="text-yellow-400 font-black text-xl tracking-[0.2em] mb-2 text-center uppercase">CORRECT ANSWER</Text>
            <Text className="text-white text-5xl font-black text-center mb-8 tracking-tight px-2" adjustsFontSizeToFit numberOfLines={2}>
              {gameData.correctAnswer}
            </Text>

            <View className="bg-white/20 w-3/4 h-[4px] rounded-full mb-6" />

            <Text className="text-emerald-400 font-black text-3xl text-center tracking-wider" adjustsFontSizeToFit numberOfLines={1}>{gameData.roundWinner}!</Text>
            <Text className="text-slate-400 font-bold text-sm uppercase mb-1 tracking-[0.3em] text-center">ANSWERED CORRECTLY</Text>
          </View>
        </View>
      )}
    </View>
  );
}
