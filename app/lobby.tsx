import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RetroButton } from '../components/RetroButton';
import { colyseusService } from '../store/colyseusService';
import { RootState } from '../store/store';
import { memphisShapes } from '../constants/theme';
import { RetroPlayerCard } from '../components/RetroPlayerCard';
import { toggleTheme } from '../store/lobbySlice';

export default function LobbyScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { playerName, players: reduxPlayers, roomId, gamePhase, theme } = useSelector((state: RootState) => state.lobby);
  const isDark = theme === 'dark';

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
            <Text className={`font-black tracking-widest text-lg ${isDark ? "text-zinc-700" : "text-black"}`}>•••••{"\n"}•••••{"\n"}•••••</Text>
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
            borderColor: isDark ? "#ffffff" : "#000000",
            transform: transform as any,
            opacity: 0.4,
          }}
          className={shape.color}
        />
      );
    });
  };

  return (
    <View style={StyleSheet.absoluteFillObject} className={`${isDark ? "bg-zinc-950" : "bg-amber-50"} justify-center pt-16`}>
      {renderBackgroundDebris()}

      {/* Theme Toggle Button */}
      <TouchableOpacity
        onPress={() => dispatch(toggleTheme())}
        style={{ position: 'absolute', top: 50, right: 24, zIndex: 10 }}
      >
        <View className={`${isDark ? "bg-zinc-800 border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]" : "bg-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"} border-3 rounded-2xl px-3 py-1.5 flex-row items-center`}>
          <Text className={`${isDark ? "text-white" : "text-black"} font-black text-xs uppercase`}>
            {isDark ? "🌙 DARK" : "☀️ LIGHT"}
          </Text>
        </View>
      </TouchableOpacity>

      <View className="items-center mb-8 px-6 mt-6">
        <View 
          style={{ borderColor: isDark ? '#ffffff' : '#000000' }}
          className={`${isDark ? "bg-yellow-600 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]" : "bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"} border-4 px-10 py-3 rounded-2xl rotate-[-1.5deg]`}
        >
          <Text className="text-3xl font-black text-black tracking-wider uppercase text-center">
            ROOM: {roomId || '...'}
          </Text>
        </View>
        <Text className={`font-black text-lg mt-5 uppercase tracking-widest ${isDark ? "text-white" : "text-black"}`}>
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

