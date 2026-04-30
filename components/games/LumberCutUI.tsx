import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';

export function LumberCutUI() {
  const { players, playerName, timer } = useSelector((state: any) => state.lobby);
  const myPlayer = players.find((p: any) => p.name === playerName);

  let gameData: any = {};
  if (myPlayer?.gameData) {
    try { gameData = JSON.parse(myPlayer.gameData); } catch (e) {}
  }

  const teams = gameData.teams || [];
  const myTeam = teams.find((t: any) => t.members.includes(myPlayer?.id));

  const handlePull = (side: 'left' | 'right') => {
    colyseusService.sendGameAction({ action: 'pull', side });
  };

  const target = gameData.targetPairs || 20;

  // Determine button mapping arrays
  const isSolo = myTeam?.members.length === 1;
  const amILeftPuller = myTeam?.members[0] === myPlayer?.id;

  return (
    <View className="flex-1 items-center justify-center w-full pt-4">
      {gameData.gameOver && gameData.winners?.includes(myPlayer?.id) && (
         <Text className="text-green-400 text-5xl font-black mb-6 text-center shadow-lg uppercase" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 2 }}>TIMBERRR!!</Text>
      )}
      {gameData.gameOver && !gameData.winners?.includes(myPlayer?.id) && (
         <Text className="text-red-400 text-5xl font-black mb-6 text-center shadow-lg uppercase" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 2 }}>TOO SLOW!!</Text>
      )}

      {/* RENDER PROGRESS BARS FOR EVERY EVALUATED TEAM */}
      <View className="w-full bg-black/40 p-4 rounded-[32px] border-4 border-white/10 mb-8 h-[250px]">
        <ScrollView className="flex-1 w-full" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
          {[...teams].sort((a, b) => b.pairs - a.pairs).map((t: any, idx: number) => {
            const progress = Math.min((t.pairs / target) * 100, 100);
            return (
              <View key={idx} className="mb-4">
                <View className="flex-row justify-between mb-2 px-2">
                  <Text className={`font-bold ${t.id === myTeam?.id ? 'text-white' : 'text-gray-400'}`}>{t.id}</Text>
                  <Text className="text-yellow-400 font-black tracking-widest">{t.pairs} / {target}</Text>
                </View>
                <View className="w-full h-10 bg-black/60 rounded-full border-4 border-white/20 overflow-hidden relative justify-center">
                   <View className={`absolute h-full left-0 ${t.id === myTeam?.id ? 'bg-blue-500' : 'bg-orange-600 opacity-60'}`} style={{ width: `${progress}%` }} />
                   <Text className="text-center font-black text-white/50 tracking-[5px] z-10 text-xs">|| LUMBER ||</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* PHYSICAL CONTROLS */}
      {!gameData.gameOver && timer > 0 && (
        <View className="flex-1 w-full justify-center pb-12">
          
          <View className="w-full bg-zinc-800 h-[100px] rounded-[40px] flex-row items-center justify-center border-[8px] border-zinc-900 mb-8 overflow-hidden relative shadow-xl">
             <View className="absolute w-24 h-[200px] bg-white/5 -left-8 right-12 rotate-[25deg]" />
             <Text className="text-center font-black text-3xl text-zinc-500 tracking-[0.3em] uppercase">CROSSCUT SAW</Text>
          </View>

          <View className="flex-row justify-center w-full gap-4">
            {(isSolo || amILeftPuller) && (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => handlePull('left')}
                disabled={myTeam?.next !== 'left'}
                className={`flex-1 h-36 rounded-[32px] items-center justify-center border-[8px] shadow-2xl ${myTeam?.next === 'left' ? 'bg-blue-500 border-blue-700' : 'bg-zinc-700 border-zinc-900 opacity-50'}`}
              >
                <Text className={`text-4xl font-black uppercase tracking-wider ${myTeam?.next === 'left' ? 'text-white' : 'text-zinc-500'}`}>{"<"} PULL</Text>
              </TouchableOpacity>
            )}

            {(isSolo || !amILeftPuller) && (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => handlePull('right')}
                disabled={myTeam?.next !== 'right'}
                className={`flex-1 h-36 rounded-[32px] items-center justify-center border-[8px] shadow-2xl ${myTeam?.next === 'right' ? 'bg-blue-500 border-blue-700' : 'bg-zinc-700 border-zinc-900 opacity-50'}`}
              >
                <Text className={`text-4xl font-black uppercase tracking-wider ${myTeam?.next === 'right' ? 'text-white' : 'text-zinc-500'}`}>PULL {">"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
