import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RetroButton } from '../components/RetroButton';
import { colyseusService } from '../store/colyseusService';
import { RootState } from '../store/store';
import { memphisShapes } from '../constants/theme';
import { RetroPlayerCard } from '../components/RetroPlayerCard';

export default function LobbyScreen() {
  const router = useRouter();
  const { playerName, players: reduxPlayers, roomId, gamePhase } = useSelector((state: RootState) => state.lobby);

  const players: any[] = reduxPlayers.length > 0 ? reduxPlayers : [];
  const myPlayer = players.find((p: any) => p.name === playerName);
  const isReady = myPlayer?.isReady || false;


  useEffect(() => {
    if (gamePhase === 'chart') {
      router.replace('/chart');
    }
  }, [gamePhase]);

  const handleReadyToggle = () => {
    colyseusService.sendReady(!isReady);
  };

  const handleLeave = () => {
    colyseusService.disconnect();
    router.back();
  };


  const renderBackgroundDebris = () => {
    return memphisShapes.map((shape, i) => {
      const transform = shape.rotate ? [{ rotate: shape.rotate }] : [];
      if (shape.type === 'dots') {
        return (
          <View key={i} style={{ position: 'absolute', top: shape.top as any, left: shape.left as any, opacity: 0.15 }}>
            <Text className="font-black tracking-widest text-lg">•••••{"\n"}•••••{"\n"}•••••</Text>
          </View>
        );
      }
      return (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: shape.top as any,
            left: shape.left as any,
            width: shape.size,
            height: shape.size,
            borderRadius: shape.type === 'circle' ? 999 : 4,
            borderWidth: 2,
            borderColor: '#000000',
            transform: transform as any,
            opacity: 0.4,
          }}
          className={shape.color}
        />
      );
    });
  };

  return (
    <View style={StyleSheet.absoluteFillObject} className="bg-amber-50 justify-center pt-16">
      {renderBackgroundDebris()}

      <View className="items-center mb-8 px-6">
        <View className="bg-yellow-400 border-4 border-black px-10 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-1.5deg]">
          <Text className="text-3xl font-black text-black tracking-wider uppercase text-center">
            ROOM: {roomId || '...'}
          </Text>
        </View>
        <Text className="text-black font-black text-lg mt-5 uppercase tracking-widest">
          WAITING FOR PLAYERS
        </Text>
      </View>

      <ScrollView className="flex-1 mb-6 px-6" showsVerticalScrollIndicator={false}>
        {players.map((p: any) => (
          <RetroPlayerCard
            key={p.id}
            name={p.name}
            isMe={p.id === myPlayer?.id}
            isHost={p.isHost}
            isReady={p.isReady}
          />
        ))}
      </ScrollView>

      <View className="pb-10 pt-4 px-6">
        <RetroButton
          title={isReady ? "CANCEL READY" : "READY UP!"}
          variant={isReady ? "secondary" : "success"}
          onPress={handleReadyToggle}
        />
        <RetroButton 
          title="LEAVE ROOM" 
          variant="danger" 
          onPress={handleLeave} 
        />
      </View>
    </View>
  );
}

