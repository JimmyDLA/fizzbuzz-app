import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { DynamicGameResults } from '../components/DynamicGameResults';
import { BalloonInflateUI } from '../components/games/BalloonInflateUI';
import { CycloneUI } from '../components/games/CycloneUI';
import { HotPotatoUI } from '../components/games/HotPotatoUI';
import { LumberCutUI } from '../components/games/LumberCutUI';
import { MathProblemUI } from '../components/games/MathProblemUI';
import { RockPaperScissorsUI } from '../components/games/RockPaperScissorsUI';
import { TappingRaceUI } from '../components/games/TappingRaceUI';
import { TriviaUI } from '../components/games/TriviaUI';
import { PartyButton } from '../components/PartyButton';
import { colyseusService } from '../store/colyseusService';

export default function GameScreen() {
  const router = useRouter();
  const {
    playerName,
    players: reduxPlayers,
    gamePhase,
    timer,
    currentGameType,
    currentCategory,
    lastWinners,
    lastLosers,
    lastGameResult
  } = useSelector((state: any) => state.lobby);

  const myPlayer = reduxPlayers.find((p: any) => p.name === playerName);
  const isReady = myPlayer?.isReady || false;

  const handleReadyToggle = () => {
    colyseusService.sendReady(true);
  };

  useEffect(() => {
    if (gamePhase === 'chart') {
      router.replace('/chart');
    } else if (isReady && gamePhase === 'resolution') {
      router.replace('/chart');
    }
  }, [gamePhase, isReady]);

  const renderCountdown = () => (
    <View className="flex-1 bg-blue-600 justify-center items-center">
      <Text className="text-white font-black text-center" style={{ fontSize: 180, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 5, height: 5 }, textShadowRadius: 5 }}>
        {timer}
      </Text>
    </View>
  );

  const renderMiniGame = () => {
    switch (currentCategory) {
      case "Tapping Race": return <TappingRaceUI />;
      case "Math Problem": return <MathProblemUI />;
      case "Hot Potato": return <HotPotatoUI />;
      case "Lumber Cut": return <LumberCutUI />;
      case "Trivia": return <TriviaUI />;
      case "Rock Paper Scissors": return <RockPaperScissorsUI />;
      case "Cyclone": return <CycloneUI />;
      case "Balloon Inflate": return <BalloonInflateUI />;
      default: return (
        <View className="flex-1 bg-red-500 justify-center items-center p-6">
          <Text className="text-white text-2xl font-bold text-center">
            A new mini-game is being played!
          </Text>
          <Text className="text-white text-xl font-bold text-center mt-4">
            Update your app to join the fun. You will sit out this round.
          </Text>
        </View>
      );
    }
  };

  const renderPlaying = () => (
    <View className="flex-1 bg-green-500 pt-16">
      <View className="items-center px-6">
        <Text className="text-white text-4xl font-black mb-2 text-center" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1 }}>{currentCategory}</Text>
        <Text className="text-white text-xl font-bold mb-6 uppercase opacity-90">{currentGameType}</Text>
      </View>

      {currentCategory !== "Hot Potato" && (
        <View className="bg-white/20 px-8 py-4 rounded-full border-[6px] border-white/30 shadow-xl mb-4 absolute top-[4.5rem] right-6 z-50">
          <Text className="text-white font-black text-xl">{timer}</Text>
        </View>
      )}

      <View className="flex-1 w-full relative">
        {renderMiniGame()}
      </View>
    </View>
  );

  const renderResolution = () => {
    const winners = reduxPlayers.filter((p: any) => lastWinners?.includes(p.id));
    const losers = reduxPlayers.filter((p: any) => lastLosers?.includes(p.id));

    return (
      <View className="flex-1 bg-purple-600 justify-center items-center px-6 pt-12">
        <Text
          className="text-white text-6xl font-black mb-10 text-center shadow-lg uppercase"
          style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 1 }}
        >
          RESULTS!
        </Text>

        {lastGameResult && (
          <DynamicGameResults rawData={lastGameResult} />
        )}

        <View className="w-full bg-black/30 rounded-[40px] p-6 mb-12 border-4 border-white/20">
          <View className="flex-row items-center justify-center mb-4">
            <Text className="text-yellow-400 font-black text-2xl text-center tracking-widest uppercase mr-2">WINNERS +3</Text>
            <View className="w-4 h-6 bg-yellow-300 rounded-[8px] border-2 border-orange-500 items-center justify-center shadow-lg">
              <View className="w-[3px] h-3 bg-orange-500 rounded-full opacity-80" />
            </View>
          </View>
          <View className="flex-row flex-wrap justify-center mb-8 gap-3">
            {winners.map((p: any) => (
              <View key={p.id} className="bg-green-500 border-[6px] border-green-700 px-6 py-3 rounded-full shadow-lg">
                <Text className="text-white font-black text-2xl uppercase tracking-wider">{p.name}</Text>
              </View>
            ))}
            {winners.length === 0 && <Text className="text-white/50 font-bold uppercase">Nobody</Text>}
          </View>

          <Text className="text-blue-300 font-black text-2xl mb-4 text-center tracking-widest uppercase mt-2"> DRINKS UP!</Text>
          <View className="flex-row flex-wrap justify-center gap-3">
            {losers.map((p: any) => (
              <View key={p.id} className="bg-red-500 border-[6px] border-red-700 px-6 py-3 rounded-full shadow-lg">
                <Text className="text-white font-black text-2xl uppercase tracking-wider">{p.name}</Text>
              </View>
            ))}
            {losers.length === 0 && <Text className="text-white/50 font-bold uppercase">Nobody</Text>}
          </View>
        </View>

        <View className="pb-10 pt-4 w-full">
          <PartyButton
            title={isReady ? "WAITING FOR OTHERS..." : "NEXT ROUND"}
            color={isReady ? "secondary" : "success"}
            onPress={handleReadyToggle}
          />
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      {gamePhase === 'countdown' && renderCountdown()}
      {gamePhase === 'playing' && renderPlaying()}
      {gamePhase === 'resolution' && renderResolution()}
    </View>
  );
}
