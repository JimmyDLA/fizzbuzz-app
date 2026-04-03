import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { PartyButton } from '../components/PartyButton';
import { colyseusService } from '../store/colyseusService';
import { setPlayerName } from '../store/lobbySlice';

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'home' | 'join'>('home');

  const handleHost = async () => {
    if (!name.trim()) return alert("Please enter your name!");
    dispatch(setPlayerName(name));
    try {
      console.log("Hosting game...", name);

      const id = await colyseusService.connectAsHost(name);
      router.push({ pathname: '/lobby', params: { action: 'host', code: id } });
    } catch (e: any) {
      alert(e.message || "Failed to create room.");
      console.log(e);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return alert("Please enter your name!");
    if (!roomCode.trim()) return alert("Please enter a room code!");
    dispatch(setPlayerName(name));
    try {
      const id = await colyseusService.connectAsJoin(roomCode, name);
      router.push({ pathname: '/lobby', params: { action: 'join', code: id } });
    } catch (e: any) {
      alert(e.message || "Failed to join room.");
      console.log(e);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-indigo-900 justify-center px-6">
      <View className="items-center mb-12">
        <View className="w-40 h-40 bg-yellow-400 rounded-full items-center justify-center border-8 border-yellow-200 shadow-2xl mb-6">
          <Text className="text-5xl font-black text-indigo-900 shadow-sm">FB</Text>
        </View>
        <Text className="text-6xl font-black text-white text-center mb-2" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 2 }}>FizzBuzz</Text>
        <Text className="text-xl text-indigo-200 font-black tracking-widest text-center">MINI DRINKING GAMES</Text>
      </View>

      <View className="bg-white/10 p-6 rounded-[40px] border-4 border-white/20">
        <TextInput
          className="bg-white/95 rounded-3xl px-6 py-5 text-2xl font-black text-center text-indigo-900 mb-6"
          placeholder="ENTER YOUR NAME"
          placeholderTextColor="#818cf8"
          value={name}
          onChangeText={setName}
          maxLength={12}
        />

        {mode === 'home' ? (
          <View>
            <PartyButton title="HOST GAME" color="success" onPress={handleHost} />
            <Text className="text-white text-center text-xl font-black my-2 opacity-70">OR</Text>
            <PartyButton title="JOIN GAME" color="primary" onPress={() => setMode('join')} />
          </View>
        ) : (
          <View>
            <TextInput
              className="bg-white/95 rounded-3xl px-6 py-5 text-4xl font-black text-center text-indigo-900 mb-6 tracking-[0.2em]"
              placeholder="CODE"
              placeholderTextColor="#818cf8"
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.replace(/[^0-9]/g, ''))}
              maxLength={4}
              keyboardType="number-pad"
            />
            <PartyButton title="JOIN" color="primary" onPress={handleJoin} />
            <PartyButton title="BACK" color="danger" onPress={() => setMode('home')} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
