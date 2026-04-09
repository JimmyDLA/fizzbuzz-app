import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';

export function MathProblemUI() {
  const { players, playerName } = useSelector((state: any) => state.lobby);
  const myPlayer = players.find((p: any) => p.name === playerName);

  let gameData: any = {};
  try {
     gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) {}

  const handleAnswer = (ans: number) => {
    if (myPlayer?.gameScore === -1 || gameData.gameOver) return;
    colyseusService.sendGameAction({ action: 'answer', answer: ans });
  };

  return (
    <View className="flex-1 items-center justify-center pt-2 w-full px-2">
      <Text className="text-white text-2xl font-black mb-6 text-center opacity-80 uppercase tracking-widest">SOLVE QUICKLY! ({(gameData.index ?? 0) + 1}/3)</Text>
      
      <View className="bg-white/20 py-8 rounded-[40px] border-8 border-white/50 mb-10 shadow-2xl w-full items-center">
         <Text className="text-white text-8xl font-black " adjustsFontSizeToFit numberOfLines={1}>{gameData.question || '?'}</Text>
      </View>
      
      <View className="flex-row flex-wrap justify-between w-full">
         {gameData.options?.map((opt: number, idx: number) => {
            const isLocked = gameData.isLockedOut;
            return (
              <TouchableOpacity 
                 key={idx}
                 activeOpacity={0.8}
                 onPress={() => handleAnswer(opt)}
                 disabled={isLocked || gameData.gameOver}
                 className={`w-[48%] aspect-square rounded-3xl items-center justify-center border-8 shadow-xl mb-4 ${
                   isLocked 
                     ? 'bg-slate-700 border-slate-900 opacity-50'
                     : (gameData.gameOver && opt === gameData.correct) 
                        ? 'bg-green-500 border-green-700' 
                        : 'bg-blue-500 border-blue-700'
                 }`}
              >
                 <Text className="text-white text-6xl font-black" adjustsFontSizeToFit numberOfLines={1}>{opt}</Text>
              </TouchableOpacity>
            )
         })}
      </View>
      
      {gameData.isLockedOut && !gameData.gameOver && (
         <Text className="text-red-400 font-black text-2xl mt-2 tracking-widest text-center uppercase shadow-sm">Waiting for someone to solve it...</Text>
      )}
      
      {gameData.gameOver && gameData.winnerId !== myPlayer?.id && (
         <Text className="text-yellow-400 font-black text-3xl mt-4 tracking-wider text-center uppercase shadow-sm">TOO SLOW!</Text>
      )}
      {gameData.gameOver && gameData.winnerId === myPlayer?.id && (
         <Text className="text-green-400 font-black text-3xl mt-4 tracking-wider text-center uppercase shadow-sm">CORRECT!</Text>
      )}
    </View>
  );
}
