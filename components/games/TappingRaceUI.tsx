import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';

export function TappingRaceUI() {
  const { players, playerName, selectedPlayers } = useSelector((state: any) => state.lobby);
  const myPlayer = players.find((p: any) => p.name === playerName);

  return (
    <View className="flex-1 items-center justify-center pt-8 w-full">
      <Text className="text-white text-4xl font-black mb-12 text-center shadow-lg" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1 }}>TAP AS FAST AS YOU CAN!</Text>
      
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => colyseusService.sendGameAction({ action: 'tap' })}
        className="w-64 h-64 bg-red-500 rounded-full items-center justify-center border-[12px] border-red-700 shadow-2xl mb-12"
      >
        <Text className="text-white text-8xl font-black">{myPlayer?.gameScore || 0}</Text>
      </TouchableOpacity>
      
      <View className="flex-row flex-wrap justify-center gap-4 w-full px-4">
         {players.filter((p: any) => p.id !== myPlayer?.id && selectedPlayers?.includes(p.id)).map((p: any) => (
            <View key={p.id} className="bg-white/20 px-6 py-4 rounded-3xl border-4 border-white/30">
               <Text className="text-white font-bold text-center text-xl">{p.name}</Text>
               <Text className="text-yellow-400 font-black text-3xl text-center">{p.gameScore || 0}</Text>
            </View>
         ))}
      </View>
    </View>
  );
}
