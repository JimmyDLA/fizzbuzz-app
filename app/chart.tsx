import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { PartyButton } from '../components/PartyButton';
import { colyseusService } from '../store/colyseusService';

const TYPES = ["1v1", "2v2", "BR"];
const CATS = ["Tapping Race", "Math Problem", "Hot Potato", "Lumber Cut", "Trivia", "Rock Paper Scissors", "Cyclone", "Balloon Inflate"];

export default function ChartScreen() {
  const { roomId, playerName, players: reduxPlayers, gamePhase, timer, currentGameType, currentCategory, selectedPlayers } = useSelector((state: any) => state.lobby);

  const players = reduxPlayers.length > 0 ? reduxPlayers : [];
  const myPlayer = players.find((p: any) => p.name === playerName);
  const isReady = myPlayer?.isReady || false;
  const amISelected = selectedPlayers?.includes(myPlayer?.id) || false;

  const [displayedType, setDisplayedType] = useState('?');
  const [displayedCategory, setDisplayedCategory] = useState('?');
  const [displayedPlayers, setDisplayedPlayers] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const hasSpunRef = useRef(false);
  const isLeavingRef = useRef(false);

  // Dev Modal State
  const [showDevModal, setShowDevModal] = useState(false);
  const [devType, setDevType] = useState(TYPES[0]);
  const [devCategory, setDevCategory] = useState(CATS[0]);
  const [devPlayers, setDevPlayers] = useState<string[]>([]);

  useEffect(() => {
    let interval: any;
    let timeout: any;
    let autoDismiss: any;

    if (gamePhase === 'wheel' && !hasSpunRef.current) {
      hasSpunRef.current = true;
      setIsSpinning(true);
      setShowWheelModal(true);

      let requiredCount = 2;
      if (currentGameType === '1v1') requiredCount = 2;
      if (currentGameType === '2v2') requiredCount = 4;
      if (currentGameType === 'BR') requiredCount = players.length;

      interval = setInterval(() => {
        setDisplayedType(TYPES[Math.floor(Math.random() * TYPES.length)]);
        setDisplayedCategory(CATS[Math.floor(Math.random() * CATS.length)]);

        const randomP = [...players].sort(() => 0.5 - Math.random()).slice(0, requiredCount).map((p) => p.id);
        setDisplayedPlayers(randomP);
      }, 100);

      timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplayedType(currentGameType || '?');
        setDisplayedCategory(currentCategory || '?');
        setDisplayedPlayers(selectedPlayers || []);
        setIsSpinning(false);

        if (!selectedPlayers?.includes(myPlayer?.id)) {
          autoDismiss = setTimeout(() => setShowWheelModal(false), 3000);
        }
      }, 2000);

    } else if (gamePhase !== 'wheel') {
      setShowWheelModal(false);
      hasSpunRef.current = false;
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(autoDismiss);
    };
  }, [gamePhase, currentGameType, currentCategory, selectedPlayers, players.length]);

  useEffect(() => {
    if (isLeavingRef.current) return;
    if (gamePhase === 'lobby') {
      router.replace('/lobby');
    } else if (amISelected && !isReady && (gamePhase === 'countdown' || gamePhase === 'playing' || gamePhase === 'resolution')) {
      router.replace('/game');
    }
  }, [gamePhase, isReady, amISelected]);

  const handleReadyToggle = () => {
    colyseusService.sendReady(!isReady);
  };

  const handleLeaveGame = () => {
    Alert.alert("Leave Game", "Are you sure you want to end the session? You will return to the home screen.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Exit", style: "destructive", onPress: () => {
          isLeavingRef.current = true;
          colyseusService.disconnect();
          router.replace('/' as any);
        }
      }
    ]);
  };

  const openDevModal = () => {
    setDevType(TYPES[0]);
    setDevCategory(CATS[0]);
    setDevPlayers([]);
    setShowDevModal(true);
  };

  const toggleDevPlayer = (id: string) => {
    if (devPlayers.includes(id)) {
      setDevPlayers(devPlayers.filter(p => p !== id));
    } else {
      setDevPlayers([...devPlayers, id]);
    }
  };

  const handleDevCategoryChange = (c: string) => {
    setDevCategory(c);
    // Enforce 1v1 for RPS
    if (c === "Rock Paper Scissors") {
      setDevType("1v1");
    }
    // Enforce no 2v2 for Hot Potato
    if (c === "Hot Potato" && devType === "2v2") {
      setDevType("1v1");
    }
  };

  const handleDevTypeChange = (t: string) => {
    if (devCategory === "Rock Paper Scissors" && t !== "1v1") {
      return; // RPS is strictly 1v1
    }
    if (devCategory === "Hot Potato" && t === "2v2") {
      return; // Hot Potato doesn't do 2v2
    }
    setDevType(t);
  };

  const handleDevStart = () => {
    const isValid = devType === '1v1' ? devPlayers.length === 2 :
      devType === '2v2' ? devPlayers.length === 4 :
        devPlayers.length >= 2;

    if (!isValid) return alert(`Expected ${devType === '1v1' ? 2 : devType === '2v2' ? 4 : '2+'} players for this mode!`);
    colyseusService.sendDevStart(devType, devCategory, devPlayers);
    setShowDevModal(false);
  };

  return (
    <View className="flex-1 bg-green-900 pt-16">
      <View className="flex-row items-center justify-between mb-8 w-full px-6">
        <TouchableOpacity onPress={handleLeaveGame} className="bg-red-500 w-12 h-12 rounded-full items-center justify-center border-4 border-red-700 shadow-xl">
          <Text className="text-white font-black text-xl">X</Text>
        </TouchableOpacity>

        <View className="flex-1 items-center mr-12">
          <Text className="text-white text-4xl font-black tracking-widest uppercase" style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 1 }}>
            Game Chart
          </Text>
          <Text className="text-yellow-400 font-bold text-lg mt-1 tracking-widest">
            ROOM: {roomId}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 mb-6 px-6" showsVerticalScrollIndicator={false}>
        {(() => {
          const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
          let currentRank = 1;

          return sortedPlayers.map((p: any, index: number) => {
            if (index > 0 && p.score < sortedPlayers[index - 1].score) {
              currentRank++;
            }
            return (
              <View
                key={p.id}
                className={`flex-row items-center justify-between p-5 mb-4 rounded-3xl border-b-8 ${p.id === myPlayer?.id ? 'bg-blue-500 border-blue-700' : 'bg-white/10 border-white/20'}`}
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-yellow-400 font-black text-3xl mr-4" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>#{currentRank}</Text>
                  <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-3">
                    <Text className="text-2xl font-black text-white">{p.name.charAt(0)}</Text>
                  </View>
                  <Text className="text-2xl font-black text-white flex-1" numberOfLines={1}>
                    {p.name} {p.isHost && '👑'}
                  </Text>
                </View>
                <View className="flex-row items-center bg-yellow-400 px-4 py-2 rounded-2xl ml-2 shadow-sm border-b-4 border-yellow-600">
                  <View className="w-5 h-7 bg-yellow-200 rounded-[10px] border-2 border-orange-500 items-center justify-center mr-2 shadow-sm">
                    <View className="w-1 h-4 bg-orange-400 rounded-full" />
                  </View>
                  <Text className="text-indigo-900 font-black text-2xl">{p.score}</Text>
                </View>
              </View>
            );
          });
        })()}
      </ScrollView>

      {gamePhase === 'chart' && (
        <View className="pb-10 pt-4 w-full px-6">
          {myPlayer?.isHost ? (
            <View>
              <PartyButton title="SPIN WHEEL!" color="secondary" onPress={() => colyseusService.startWheel()} />
              <TouchableOpacity onPress={openDevModal} className="mt-4 p-3 border-4 border-white/20 rounded-full mx-32">
                <Text className="text-white text-center font-bold tracking-[0.2em] opacity-80">DEV MODE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-black/30 p-8 rounded-[32px] items-center border-4 border-white/10">
              <Text className="text-white text-2xl font-black opacity-80 uppercase text-center tracking-wider">Waiting for host...</Text>
            </View>
          )}
        </View>
      )}

      {showWheelModal && (
        <View className="absolute top-0 left-0 w-full h-[150%] bg-black/90 p-6 z-50 pt-32">
          <View className="bg-pink-500 w-full p-8 rounded-[40px] border-[10px] border-pink-700 shadow-2xl items-center relative">
            <Text className="text-white text-5xl font-black mb-8 text-center shadow-lg uppercase"
              style={{
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 3, height: 3 },
                textShadowRadius: 1
              }}>
              {displayedType}
            </Text>

            <View className="flex-row flex-wrap justify-center items-center mb-6 gap-3 min-h-[130px]">
              {(() => {
                const selectedPs = players.filter((p: any) => displayedPlayers.includes(p.id));

                if (displayedType === '2v2' && selectedPs.length === 4) {
                  return (
                    <View className="items-center justify-center flex-wrap">
                      <View className="bg-indigo-500 px-5 py-3 rounded-full border-4 border-indigo-300 shadow-lg">
                        <Text className="text-white font-black text-xl">{selectedPs[0].name} & {selectedPs[1].name}</Text>
                      </View>
                      <Text className="text-yellow-400 font-black text-3xl mx-4 italic"
                        style={{
                          textShadowColor: 'rgba(0,0,0,0.5)',
                          textShadowOffset: { width: 2, height: 2 },
                          textShadowRadius: 1
                        }}
                      >
                        VS
                      </Text>
                      <View className="bg-rose-500 px-5 py-3 rounded-full border-4 border-rose-300 shadow-lg">
                        <Text className="text-white font-black text-xl">{selectedPs[2].name} & {selectedPs[3].name}</Text>
                      </View>
                    </View>
                  );
                }

                return selectedPs.map((p: any) => (
                  <View key={p.id} className="bg-white/20 px-5 py-3 rounded-full border-4 border-white/50">
                    <Text className="text-white font-black text-xl">{p.name}</Text>
                  </View>
                ));
              })()}
            </View>

            <View className="bg-indigo-600 p-8 rounded-3xl border-8 border-indigo-400 w-full items-center justify-center mb-10 shadow-inner min-h-[160px]">
              <Text className="text-blue-200 text-xl font-black uppercase mb-2">CATEGORY</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
                className="text-white font-black uppercase text-center w-full"
                style={{ fontSize: 36, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1 }}
              >
                {displayedCategory}
              </Text>
            </View>

            <View className="h-32 justify-center items-center w-full">
              {isSpinning ? (
                <View className="w-32 h-32 rounded-full border-[8px] border-white/30 items-center justify-center">
                  <Text className="text-white/80 font-bold text-center text-lg">Spinning...</Text>
                </View>
              ) : (
                amISelected ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleReadyToggle}
                    className={`w-32 h-32 rounded-full items-center justify-center border-[8px] shadow-2xl ${isReady ? 'bg-green-500 border-green-300' : 'bg-gray-400/70 border-gray-200/70'}`}
                  >
                    <Text className={`text-6xl font-black ${isReady ? 'text-white' : 'text-gray-500'}`}>✓</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="w-full">
                    <PartyButton title="DISMISS" color="secondary" onPress={() => setShowWheelModal(false)} />
                  </View>
                )
              )}
            </View>
          </View>
        </View>
      )}

      {showDevModal && (
        <View className="absolute top-0 left-0 w-full h-[150%] z-50 pt-16 px-6 pb-32" style={{ backgroundColor: 'rgba(0,0,0,0.95)', position: 'absolute' }}>
          <View className="flex-1 w-full pt-4 pb-32">
            <Text className="text-yellow-400 text-3xl font-black mb-8 text-center uppercase tracking-widest px-2" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1 }}>DEV OVERRIDE</Text>
            <ScrollView className="w-full flex-1 mb-32" showsVerticalScrollIndicator={false}>

              <Text className="text-white font-black opacity-80 text-xl tracking-widest mb-4 ml-2">GAME TYPE</Text>
              <View className="flex-row gap-2 mb-8">
                {TYPES.map(t => {
                  const isBlocked = (devCategory === "Rock Paper Scissors" && t !== "1v1") ||
                    (devCategory === "Hot Potato" && t === "2v2");
                  return (
                    <Pressable
                      key={t}
                      onPress={() => handleDevTypeChange(t)}
                      className={`flex-1 py-4 border-[6px] rounded-[32px] items-center ${devType === t ? 'bg-indigo-600 border-indigo-400' : 'bg-white/10 border-white/10'} ${isBlocked ? 'opacity-20' : ''}`}
                    >
                      <Text className={`font-black text-xl tracking-wider ${devType === t ? 'text-white' : 'text-gray-400'}`}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="text-white font-black opacity-80 text-xl tracking-widest mb-4 ml-2">CATEGORY</Text>
              <View className="flex-row flex-wrap gap-2 mb-8 border-b-4 border-white/10 pb-8">
                {CATS.map(c => (
                  <Pressable key={c} onPress={() => handleDevCategoryChange(c)} className={`w-[48%] py-4 border-[6px] rounded-[32px] items-center justify-center shadow-lg mb-2 ${devCategory === c ? 'bg-pink-600 border-pink-400' : 'bg-white/10 border-white/10'}`}>
                    <Text className={`font-black text-center text-sm uppercase tracking-wider ${devCategory === c ? 'text-white' : 'text-gray-400'}`}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-white font-black opacity-80 text-xl tracking-widest mb-4 ml-2">PLAYERS ({devPlayers.length} SELECTED)</Text>
              <View className="flex-row flex-wrap gap-3 mb-10">
                {players.map((p: any) => {
                  const isSelected = devPlayers.includes(p.id);
                  return (
                    <View key={p.id}>
                      <Pressable onPress={() => toggleDevPlayer(p.id)} className={`px-6 py-4 border-[6px] rounded-full items-center ${isSelected ? 'bg-green-600 border-green-400' : 'bg-white/10 border-white/10'}`}>
                        <Text className={`font-black text-xl tracking-wider ${isSelected ? 'text-white' : 'text-gray-400'}`}>{p.name}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              <View className="pt-4 gap-4 pb-12 shadow-2xl">
                <PartyButton title="FORCE START" color="success" onPress={handleDevStart} />
                <Pressable onPress={() => setShowDevModal(false)} className="w-full bg-red-500 py-5 rounded-[40px] items-center border-[8px] border-red-700 shadow-2xl mt-2">
                  <Text className="text-white font-black text-2xl tracking-[0.2em]">CANCEL</Text>
                </Pressable>
              </View>
            </ScrollView>

          </View>
        </View>
      )}
    </View>
  );
}
