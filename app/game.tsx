import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { DynamicGameResults } from "../components/DynamicGameResults";
import { BalloonInflateUI } from "../components/games/BalloonInflateUI";
import { CycloneUI } from "../components/games/CycloneUI";
import { HotPotatoUI } from "../components/games/HotPotatoUI";
import { LumberCutUI } from "../components/games/LumberCutUI";
import { MathProblemUI } from "../components/games/MathProblemUI";
import { PerfectionUI } from "../components/games/PerfectionUI";
import { RockPaperScissorsUI } from "../components/games/RockPaperScissorsUI";
import { ScrabbleUI } from "../components/games/ScrabbleUI";
import { ScreenPaintingUI } from "../components/games/ScreenPaintingUI";
import { SimonSaysUI } from "../components/games/SimonSaysUI";
import { TappingRaceUI } from "../components/games/TappingRaceUI";
import { TriviaUI } from "../components/games/TriviaUI";
import { GameProvider } from "../components/games/useGameData";
import { RetroButton } from "../components/RetroButton";
import { colyseusService } from "../store/colyseusService";
import { memphisShapes } from "../constants/theme";

export default function GameScreen() {
  const router = useRouter();
  const theme = useSelector((state: any) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const {
    playerName,
    players: reduxPlayers,
    gamePhase,
    timer,
    currentGameType,
    currentCategory,
    lastWinners,
    lastLosers,
    lastGameResult,
  } = useSelector((state: any) => state.lobby);

  const myPlayer = reduxPlayers.find((p: any) => p.name === playerName);
  const isReady = myPlayer?.isReady || false;

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) {}

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

  const handleReadyToggle = () => {
    colyseusService.sendReady(true);
  };

  useEffect(() => {
    if (gamePhase === "chart") {
      router.replace("/chart");
    } else if (isReady && gamePhase === "resolution") {
      router.replace("/chart");
    }
  }, [gamePhase, isReady, router]);

  const renderCountdown = () => (
    <View className="flex-1 bg-transparent justify-center items-center px-6">
      <Text className="text-white font-black text-2xl uppercase tracking-widest text-center mb-10">
        PREPARE TO PLAY!
      </Text>

      <View style={styles.countdownCard}>
        {/* Shadow */}
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: 40 }]}
          className={isDark ? "bg-white" : "bg-black"}
        />
        {/* Card Face */}
        <View
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 40,
            borderWidth: 5,
            borderColor: isDark ? "#ffffff" : "#000000",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateY: -6 }, { translateX: -6 }]
          }}
          className={isDark ? "bg-yellow-600" : "bg-yellow-300"}
        >
          <Text className="text-black font-black text-8xl font-mono text-center">
            {timer}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderMiniGame = () => {
    switch (currentCategory) {
      case "Tapping Race":
        return <TappingRaceUI />;
      case "Math Problem":
        return <MathProblemUI />;
      case "Hot Potato":
        return <HotPotatoUI />;
      case "Lumber Cut":
        return <LumberCutUI />;
      case "Trivia":
        return <TriviaUI />;
      case "Rock Paper Scissors":
        return <RockPaperScissorsUI />;
      case "Cyclone":
        return <CycloneUI />;
      case "Balloon Inflate":
        return <BalloonInflateUI />;
      case "Simon Says":
        return <SimonSaysUI />;
      case "Scrabble":
        return <ScrabbleUI />;
      case "Screen Painting":
        return <ScreenPaintingUI />;
      case "Perfection":
        return <PerfectionUI />;
      default:
        return (
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

  const renderPlaying = () => {
    return (
      <View className="flex-1 bg-transparent pt-12">
        {/* Header HUD Title Card */}
        <View style={styles.headerTitleCard} className="z-10">
          {/* Shadow */}
          <View
            style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            className={isDark ? "bg-white" : "bg-black"}
          />
          {/* Face */}
          <View
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
              borderWidth: 3,
              borderColor: isDark ? "#ffffff" : "#000000",
              alignItems: "center",
              justifyContent: "center",
              transform: [{ translateY: -3 }, { translateX: -3 }]
            }}
            className={isDark ? "bg-zinc-900" : "bg-white"}
          >
            <Text className={`font-black text-lg uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>
              {currentCategory}
            </Text>
            <Text className={`font-black text-[9px] uppercase tracking-widest mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {currentGameType}
            </Text>
          </View>
        </View>

        {/* Global Timer Badge */}
        {currentCategory !== "Hot Potato" && currentCategory !== "Simon Says" && (
          <View style={styles.timerBadge}>
            {/* Shadow */}
            <View
              style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
              className={isDark ? "bg-white" : "bg-black"}
            />
            {/* Face */}
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 24,
                borderWidth: 3,
                borderColor: isDark ? "#ffffff" : "#000000",
                alignItems: "center",
                justifyContent: "center",
                transform: [{ translateY: -3 }, { translateX: -3 }]
              }}
              className="bg-rose-400"
            >
              <Text className="text-black font-black text-base font-mono">{timer}</Text>
            </View>
          </View>
        )}

        <View className="flex-1 w-full relative">{renderMiniGame()}</View>
      </View>
    );
  };

  const renderResolution = () => {
    const winners = reduxPlayers.filter((p: any) =>
      lastWinners?.includes(p.id),
    );
    const losers = reduxPlayers.filter((p: any) => lastLosers?.includes(p.id));

    return (
      <SafeAreaView className="flex-1 justify-between items-center px-6 pt-12 pb-8 bg-transparent w-full">
        {/* Results title badge */}
        <View style={styles.resultsTitleWrapper} className="mb-6">
          {/* Shadow */}
          <View
            style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            className={isDark ? "bg-white" : "bg-black"}
          />
          {/* Face */}
          <View
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
              borderWidth: 3,
              borderColor: isDark ? "#ffffff" : "#000000",
              alignItems: "center",
              justifyContent: "center",
              transform: [{ translateY: -3 }, { translateX: -3 }]
            }}
            className="bg-rose-400"
          >
            <Text className="text-black font-black text-2xl uppercase tracking-wider">
              RESULTS!
            </Text>
          </View>
        </View>

        {/* Scroll board */}
        <View style={styles.resultsScrollWrapper}>
          {/* Shadow */}
          <View
            style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
            className={isDark ? "bg-white" : "bg-black"}
          />
          {/* Face */}
          <View
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 28,
              borderWidth: 4,
              borderColor: isDark ? "#ffffff" : "#000000",
              overflow: "hidden",
              transform: [{ translateY: -5 }, { translateX: -5 }]
            }}
            className={isDark ? "bg-zinc-900" : "bg-orange-50"}
          >
            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {lastGameResult && (
                <View className="mb-6 border-b-2 border-black/10 dark:border-white/10 pb-6">
                  <DynamicGameResults rawData={lastGameResult} />
                </View>
              )}

              {/* Winners Header */}
              <View className="flex-row items-center justify-center mb-4">
                <Text className={`font-black text-lg text-center tracking-widest uppercase mr-2 ${isDark ? "text-yellow-400" : "text-black"}`}>
                  WINNERS +3
                </Text>
                <View className="w-4 h-6 bg-yellow-300 rounded-[8px] border-2 border-black items-center justify-center">
                  <View className="w-[3px] h-3 bg-black rounded-full opacity-80" />
                </View>
              </View>

              {/* Winners list items */}
              <View className="flex-row flex-wrap justify-center mb-6 gap-3">
                {winners.map((p: any) => (
                  <View
                    key={p.id}
                    className="bg-emerald-400 border-3 border-black px-4 py-1.5 rounded-full"
                  >
                    <Text className="text-black font-black text-sm uppercase tracking-wider">
                      {p.name}
                    </Text>
                  </View>
                ))}
                {winners.length === 0 && (
                  <Text className={`font-black uppercase text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Nobody
                  </Text>
                )}
              </View>

              {/* Losers Header */}
              <Text className={`font-black text-lg mb-4 text-center tracking-widest uppercase ${isDark ? "text-rose-400" : "text-black"}`}>
                DRINKS UP!
              </Text>

              {/* Losers list items */}
              <View className="flex-row flex-wrap justify-center gap-3 mb-4">
                {losers.map((p: any) => (
                  <View
                    key={p.id}
                    className="bg-red-400 border-3 border-black px-4 py-1.5 rounded-full"
                  >
                    <Text className="text-black font-black text-sm uppercase tracking-wider">
                      {p.name}
                    </Text>
                  </View>
                ))}
                {losers.length === 0 && (
                  <Text className={`font-black uppercase text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Nobody
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>

        <View className="w-full">
          <RetroButton
            title={isReady ? "WAITING FOR OTHERS..." : "NEXT ROUND"}
            variant={isReady ? "secondary" : "success"}
            onPress={handleReadyToggle}
          />
        </View>
      </SafeAreaView>
    );
  };

  const isDarkGame = currentCategory === "Simon Says" || isDark;
  let screenBgClass = isDarkGame ? "bg-zinc-950" : "bg-green-500";
  if (gamePhase === "countdown") {
    screenBgClass = "bg-indigo-500";
  } else if (gamePhase === "resolution") {
    screenBgClass = isDark ? "bg-zinc-950" : "bg-amber-100";
  }

  return (
    <GameProvider isPractice={false}>
      <SafeAreaView className={`flex-1 relative ${screenBgClass}`}>
        {renderBackgroundDebris()}
        {gamePhase === "countdown" && renderCountdown()}
        {gamePhase === "playing" && renderPlaying()}
        {gamePhase === "resolution" && renderResolution()}

        {gamePhase === "playing" && gameData.finished && (
          <View className="absolute inset-0 bg-black/75 items-center justify-center z-50 px-6">
            <View style={styles.finishedCard}>
              {/* Shadow */}
              <View
                style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                className={isDark ? "bg-white" : "bg-black"}
              />
              {/* Card Face */}
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 24,
                  borderWidth: 4,
                  borderColor: isDark ? "#ffffff" : "#000000",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ translateY: -5 }, { translateX: -5 }]
                }}
                className="bg-red-400"
              >
                <Text className="text-black text-4xl font-black uppercase text-center tracking-wider">
                  FINISHED!
                </Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  countdownCard: {
    width: 180,
    height: 180,
    position: "relative",
  },
  headerTitleCard: {
    width: "70%",
    height: 52,
    alignSelf: "center",
    marginBottom: 12,
    position: "relative",
  },
  timerBadge: {
    width: 48,
    height: 48,
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 50,
  },
  resultsTitleWrapper: {
    width: 200,
    height: 54,
    position: "relative",
  },
  resultsScrollWrapper: {
    flex: 1,
    width: "100%",
    marginBottom: 24,
    position: "relative",
  },
  finishedCard: {
    width: 260,
    height: 100,
    position: "relative",
  }
});
