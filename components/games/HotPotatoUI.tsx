import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';
import { useEffect, useRef } from 'react';

export function HotPotatoUI() {
  const { players, playerName, selectedPlayers, timer } = useSelector((state: any) => state.lobby);
  const myPlayer = players.find((p: any) => p.name === playerName);

  let gameData: any = {};
  try {
     gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) {}

  const amIHolder = gameData.potatoHolderId === myPlayer?.id;
  const holderPlayer = players.find((p: any) => p.id === gameData.potatoHolderId);

  // Simple pulsing scale animation for the potato
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (amIHolder) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, easing: Easing.bounce, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 150, easing: Easing.bounce, useNativeDriver: true })
        ])
      ).start();
    } else {
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
    }
  }, [amIHolder]);

  const handlePass = () => {
    if (!amIHolder) return;
    colyseusService.sendGameAction({ action: 'pass' });
  };

  return (
    <View className="flex-1 items-center justify-center pt-2 w-full px-2">
      {amIHolder ? (
        <Text className="text-red-400 text-6xl font-black mb-8 text-center uppercase tracking-widest" style={{ textShadowColor: 'rgba(255,0,0,0.5)', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 5 }}>PASS IT!</Text>
      ) : (
        <Text className="text-white text-3xl font-black mb-12 text-center opacity-80 uppercase tracking-widest">
           {holderPlayer?.name} HAS IT!
        </Text>
      )}
      
      <View className="items-center justify-center h-80 w-full mb-8 relative">
        {amIHolder ? (
           <TouchableOpacity activeOpacity={0.6} onPress={handlePass}>
             <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="w-64 h-80 bg-orange-800 rounded-[100px] border-[16px] border-orange-900 items-center justify-center">
                 <Text className="text-white font-black text-4xl opacity-50">POTATO</Text>
             </Animated.View>
           </TouchableOpacity>
        ) : (
           <View className="w-48 h-64 bg-black/40 rounded-[80px] border-[10px] border-black/50 items-center justify-center">
                <Text className="text-white/30 font-bold text-2xl uppercase">waiting...</Text>
           </View>
        )}
      </View>

      <View className="flex-row flex-wrap justify-center gap-4 w-full px-4">
         {players.filter((p: any) => p.id !== myPlayer?.id && selectedPlayers?.includes(p.id)).map((p: any) => (
            <View key={p.id} className={`px-6 py-4 rounded-3xl border-4 ${gameData.potatoHolderId === p.id ? 'bg-orange-600 border-orange-400' : 'bg-white/10 border-white/20'}`}>
               <Text className={`font-bold text-center text-xl ${gameData.potatoHolderId === p.id ? 'text-white' : 'text-white/60'}`}>{p.name}</Text>
            </View>
         ))}
      </View>
    </View>
  );
}
