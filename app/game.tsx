import { isExpoGo } from "@/utils/environment";
import {
  playBeerOpeningSound,
  playCountDownSound,
  playWhistleSound,
} from "@/utils/sound";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
import { memphisShapes } from "../constants/theme";
import { colyseusService } from "../store/colyseusService";

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
      if (shape.type === "dots") {
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              top: shape.top as any,
              left: shape.left as any,
              opacity: 0.15,
            }}
          >
            <Text
              className={`font-black tracking-widest text-lg ${isDark ? "text-zinc-700" : "text-black"}`}
            >
              •••••{"\n"}•••••{"\n"}•••••
            </Text>
          </View>
        );
      }
      return (
        <View
          key={i}
          style={{
            position: "absolute",
            top: shape.top as any,
            left: shape.left as any,
            width: shape.size,
            height: shape.size,
            borderRadius: shape.type === "circle" ? 999 : 4,
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

  const [showBeerModal, setShowBeerModal] = useState(false);
  const [hasDismissedModal, setHasDismissedModal] = useState(false);

  const handleCloseBeerModal = () => {
    setShowBeerModal(false);
    setHasDismissedModal(true);
  };

  const losers = reduxPlayers.filter((p: any) => lastLosers?.includes(p.id));

  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let soundTimer: any;
    if (showBeerModal && losers.length > 0) {
      soundTimer = setTimeout(() => {
        playBeerOpeningSound();
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      bounceAnim.setValue(0);
      pulseAnim.setValue(1);
    }
    return () => {
      if (soundTimer) clearTimeout(soundTimer);
    };
  }, [showBeerModal, losers.length]);

  useEffect(() => {
    let showTimer: any;
    if (gamePhase === "resolution" && !hasDismissedModal && losers.length > 0) {
      showTimer = setTimeout(() => {
        setShowBeerModal(true);
      }, 200);
    } else if (gamePhase !== "resolution") {
      setShowBeerModal(false);
      setHasDismissedModal(false);
    }
    if (gamePhase === "countdown" && timer === 3) {
      playCountDownSound();
    }
    return () => {
      if (showTimer) clearTimeout(showTimer);
    };
  }, [gamePhase, hasDismissedModal, timer, losers.length]);

  const wasFinishedRef = useRef(false);

  useEffect(() => {
    const isEnded =
      gamePhase === "resolution" ||
      (gamePhase === "playing" && gameData.finished);

    if (isEnded && !wasFinishedRef.current) {
      playWhistleSound();
      wasFinishedRef.current = true;
    } else if (
      gamePhase === "countdown" ||
      (gamePhase === "playing" && !gameData.finished)
    ) {
      wasFinishedRef.current = false;
    }
  }, [gamePhase, gameData.finished]);

  useEffect(() => {
    if (gamePhase === "chart") {
      router.replace("/chart");
    } else if (isReady && gamePhase === "resolution") {
      router.replace("/chart");
    }
  }, [gamePhase, isReady, router]);

  const renderCountdown = () => {
    console.log("Countdown phase, timer:", timer);
    // setTimeout(() => {
    //   playCountDownSound();
    // }, 2000);
    return (
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
              transform: [{ translateY: -6 }, { translateX: -6 }],
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
  };

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
        return isExpoGo ? (
          <View className="flex-1 bg-yellow-500 justify-center items-center p-6">
            <Text className="text-black text-2xl font-bold text-center uppercase tracking-widest">
              Screen Painting requires a Development Build!
            </Text>
          </View>
        ) : (
          <ScreenPaintingUI />
        );
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
              transform: [{ translateY: -3 }, { translateX: -3 }],
            }}
            className={isDark ? "bg-zinc-900" : "bg-white"}
          >
            <Text
              className={`font-black text-lg uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
            >
              {currentCategory}
            </Text>
            <Text
              className={`font-black text-[9px] uppercase tracking-widest mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
            >
              {currentGameType}
            </Text>
          </View>
        </View>

        {/* Global Timer Badge */}
        {currentCategory !== "Hot Potato" &&
          currentCategory !== "Simon Says" && (
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
                  transform: [{ translateY: -3 }, { translateX: -3 }],
                }}
                className="bg-rose-400"
              >
                <Text className="text-black font-black text-base font-mono">
                  {timer}
                </Text>
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
              transform: [{ translateY: -3 }, { translateX: -3 }],
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
              transform: [{ translateY: -5 }, { translateX: -5 }],
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
                  transform: [{ translateY: -5 }, { translateX: -5 }],
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
        {/* Beer Can Animation Modal on Results Screen */}
        {gamePhase === "resolution" && showBeerModal && losers.length > 0 && (
          <Modal visible={true} transparent animationType="fade">
            <View className="flex-1 bg-black/75 items-center justify-center px-6">
              <View className="w-[88%] max-w-[340px] relative">
                {/* Dynamic Offset Shadow */}
                <View
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    right: -6,
                    bottom: -6,
                    borderRadius: 28,
                  }}
                  className={isDark ? "bg-white" : "bg-black"}
                />
                {/* Card Face - Content determines height dynamically */}
                <View
                  style={{
                    borderRadius: 28,
                    borderWidth: 4,
                    borderColor: isDark ? "#ffffff" : "#000000",
                    alignItems: "center",
                    paddingVertical: 20,
                    paddingHorizontal: 16,
                    position: "relative",
                  }}
                  className={isDark ? "bg-zinc-900" : "bg-orange-50"}
                >
                  {/* Close 'X' Button on top-left inside the white box */}
                  <TouchableOpacity
                    onPress={handleCloseBeerModal}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      zIndex: 999,
                      elevation: 10,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 2.5,
                      borderColor: isDark ? "#ffffff" : "#000000",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    className="bg-rose-400"
                    activeOpacity={0.7}
                  >
                    <Text className="text-black font-black text-base">✕</Text>
                  </TouchableOpacity>

                  {/* Animated "DRINK UP!" Header */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      transform: [{ translateY: bounceAnim }],
                      marginTop: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      className={`font-black text-3xl uppercase tracking-widest text-center ${isDark ? "text-rose-400" : "text-black"}`}
                    >
                      DRINK UP!
                    </Text>
                  </Animated.View>

                  {/* Losers List */}
                  <View
                    pointerEvents="none"
                    style={{
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <View className="flex-row flex-wrap justify-center gap-2 max-w-full">
                      {losers.map((p: any) => (
                        <View
                          key={p.id}
                          className="bg-red-500 border-2 border-black px-3.5 py-1 rounded-full shadow-[2px_2px_0px_0px_#000]"
                        >
                          <Text className="text-white font-black text-xs uppercase tracking-wider">
                            {p.name}
                          </Text>
                        </View>
                      ))}
                      {losers.length === 0 && (
                        <View className="bg-zinc-300 border-2 border-black px-3.5 py-1 rounded-full">
                          <Text className="text-black font-black text-xs uppercase tracking-wider">
                            NOBODY
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Lottie Beer Can Animation */}
                  <View pointerEvents="none">
                    <LottieView
                      source={require("../assets/images/beer_can.json")}
                      autoPlay
                      loop
                      style={{ width: 150, height: 150, marginBottom: 0 }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Modal>
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
  },
});
