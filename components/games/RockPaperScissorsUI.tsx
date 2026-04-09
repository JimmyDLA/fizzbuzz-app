import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';

const CHOICE_COLORS: any = {
  rock: { bg: 'bg-slate-600', border: 'border-slate-800' },
  paper: { bg: 'bg-blue-400', border: 'border-blue-600' },
  scissors: { bg: 'bg-rose-500', border: 'border-rose-700' }
};

export function RockPaperScissorsUI() {
  const { players, playerName } = useSelector((state: any) => state.lobby);
  const myPlayer = players.find((p: any) => p.name === playerName);

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) {

  }

  const handlePick = (choice: string) => {
    colyseusService.sendGameAction({ action: 'pick', choice });
  };

  const myPick = gameData.results?.[myPlayer?.id];
  const hasPicked = !!gameData.picks?.[myPlayer?.id];
  const isAnimationPlaying = !!gameData.animationWord;

  return (
    <View className="flex-1 items-center justify-center pt-2 w-full px-2">
      <Text className="text-white text-2xl font-black mb-8 text-center opacity-80 uppercase tracking-widest">CHOOSE YOUR WEAPON!</Text>

      <View className="flex-row justify-between w-full px-2">
        {["rock", "paper", "scissors"].map((choice) => {
          const color = CHOICE_COLORS[choice];
          const isSelected = myPick === choice;

          return (
            <TouchableOpacity
              key={choice}
              activeOpacity={0.8}
              onPress={() => handlePick(choice)}
              disabled={hasPicked || isAnimationPlaying}
              className={`w-[31%] aspect-square rounded-[32px] items-center justify-center border-b-[10px] shadow-2xl ${color.bg} ${color.border} ${hasPicked && !isSelected ? 'opacity-40' : ''} ${isSelected ? 'border-yellow-400 border-4' : ''}`}
            >
              <Text className="text-white text-xs font-black uppercase mb-1">{choice}</Text>
              <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                <Text className="text-3xl">
                  {choice === 'rock' ? '✊' : choice === 'paper' ? '✋' : '✌️'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="mt-12 w-full items-center">
        {!isAnimationPlaying && !hasPicked && (
          <Text className="text-white/60 font-bold uppercase tracking-widest animate-pulse">Waiting for your move...</Text>
        )}
        {!isAnimationPlaying && hasPicked && (
          <Text className="text-yellow-400 font-black text-2xl uppercase tracking-widest">READY!</Text>
        )}
      </View>

      {/* Animation Overlay */}
      {isAnimationPlaying && (
        <View className="absolute inset-0 bg-black/80 items-center justify-center z-50 rounded-[40px] m-4 border-4 border-white/20">
          <Text className="text-white font-black italic text-center tracking-tighter" style={{ fontSize: 40, textShadowColor: 'rgba(52, 211, 153, 0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 }}>
            {gameData.animationWord}
          </Text>

          {gameData.reveal && (
            <View className="mt-10 flex-row gap-8 items-center">
              {players.filter((p: any) => gameData.results?.[p.id]).map((p: any) => (
                <View key={p.id} className="items-center">
                  <View className={`w-20 h-20 rounded-3xl items-center justify-center border-4 border-white/40 mb-2 ${CHOICE_COLORS[gameData.results[p.id]]?.bg}`}>
                    <Text className="text-4xl">
                      {gameData.results[p.id] === 'rock' ? '✊' : gameData.results[p.id] === 'paper' ? '✋' : '✌️'}
                    </Text>
                  </View>
                  <Text className="text-white font-bold text-xs uppercase">{p.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
