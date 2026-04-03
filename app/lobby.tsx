import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { PartyButton } from '../components/PartyButton';
import { colyseusService } from '../store/colyseusService';
import { useEffect } from 'react';

export default function LobbyScreen() {
  const router = useRouter();
  const { playerName, players: reduxPlayers, roomId, gamePhase } = useSelector((state: any) => state.lobby);

  const players = reduxPlayers.length > 0 ? reduxPlayers : [];
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

  return (
    <View className="flex-1 bg-indigo-900 pt-16">
      <View className="items-center mb-8 px-6">
        <View className="bg-yellow-400 px-10 py-4 rounded-full border-4 border-yellow-200 shadow-xl">
          <Text className="text-4xl font-black text-indigo-900 tracking-widest">
            ROOM: {roomId || '...'}
          </Text>
        </View>
        <Text className="text-white text-xl font-bold mt-4 opacity-80 uppercase tracking-wide">
          Waiting for players...
        </Text>
      </View>

      <ScrollView className="flex-1 mb-6 px-6" showsVerticalScrollIndicator={false}>
        {players.map((p: any) => (
          <View
            key={p.id}
            className={`flex-row items-center justify-between p-5 mb-4 rounded-3xl border-b-8 ${p.id === myPlayer?.id ? 'bg-blue-500 border-blue-700' : 'bg-white/10 border-white/20'}`}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center mr-4">
                <Text className="text-3xl font-black text-white">{p.name.charAt(0)}</Text>
              </View>
              <Text className="text-3xl font-black text-white flex-1" numberOfLines={1}>{p.name}</Text>
              {p.isHost && (
                <View className="ml-2 bg-yellow-400 px-3 py-1 rounded-xl">
                  <Text className="text-sm font-black text-indigo-900">HOST</Text>
                </View>
              )}
            </View>
            <View className={`px-5 py-3 rounded-2xl ml-2 ${p.isReady ? 'bg-green-500' : 'bg-red-500'}`}>
              <Text className="text-white font-black text-lg">{p.isReady ? 'READY' : 'WAIT'}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="pb-10 pt-4 px-6">
        <PartyButton
          title={isReady ? "CANCEL READY" : "READY UP!"}
          color={isReady ? "secondary" : "success"}
          onPress={handleReadyToggle}
        />
        <PartyButton title="LEAVE ROOM" color="danger" onPress={handleLeave} />
      </View>
    </View>
  );
}
