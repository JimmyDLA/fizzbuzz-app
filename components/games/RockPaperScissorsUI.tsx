import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import * as Haptics from 'expo-haptics';
import { useGameData } from './useGameData';
import { RootState } from '../../store/store';

const CHOICE_COLORS: any = {
  rock: { bg: 'bg-slate-500' },
  paper: { bg: 'bg-blue-400' },
  scissors: { bg: 'bg-rose-400' }
};

export function RockPaperScissorsUI() {
  const { players, myPlayer, sendAction, isPractice } = useGameData();
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const [pressedChoice, setPressedChoice] = useState<string | null>(null);

  // Local state for Practice Mode
  const [localGameData, setLocalGameData] = useState<{
    phase: "pick" | "animation" | "reveal" | "gameOver";
    animationWord: string;
    reveal: boolean;
    results: Record<string, string>;
    picks: Record<string, boolean>;
    scores: Record<string, number>;
    isWinner: boolean;
    isEliminated: boolean;
  }>({
    phase: "pick",
    animationWord: "",
    reveal: false,
    results: {},
    picks: {},
    scores: { player: 0, computer: 0 },
    isWinner: false,
    isEliminated: false,
  });

  const [gameData, setGameData] = useState<any>({});

  // Parse state in multiplayer mode
  useEffect(() => {
    if (!isPractice && myPlayer?.gameData) {
      try {
        setGameData(JSON.parse(myPlayer.gameData));
      } catch (e) {}
    }
  }, [myPlayer?.gameData, isPractice]);

  const startLocalGame = () => {
    setLocalGameData({
      phase: "pick",
      animationWord: "",
      reveal: false,
      results: {},
      picks: {},
      scores: { player: 0, computer: 0 },
      isWinner: false,
      isEliminated: false,
    });
  };

  // Initialize practice mode
  useEffect(() => {
    if (isPractice) {
      startLocalGame();
    }
  }, [isPractice]);

  const handlePick = (choice: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendAction({ action: 'pick', choice });
  };

  const handleLocalPick = (choice: string) => {
    if (localGameData.phase !== "pick") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setLocalGameData((prev) => ({
      ...prev,
      phase: "animation",
      picks: { player: true },
      results: { player: choice }
    }));

    const words = ["ROCK...", "PAPER...", "SCISSORS...", "SHOOT!"];
    let wordIndex = 0;

    const runAnimation = () => {
      if (wordIndex < words.length) {
        setLocalGameData((prev) => ({
          ...prev,
          animationWord: words[wordIndex]
        }));
        wordIndex++;
        setTimeout(runAnimation, 800);
      } else {
        const options = ["rock", "paper", "scissors"];
        const computerPick = options[Math.floor(Math.random() * options.length)];
        const playerPick = choice;

        setLocalGameData((prev) => {
          const nextResults = { player: playerPick, computer: computerPick };
          let p1Wins = false;
          let isTie = playerPick === computerPick;

          if (!isTie) {
            p1Wins = (playerPick === "rock" && computerPick === "scissors") ||
                     (playerPick === "paper" && computerPick === "rock") ||
                     (playerPick === "scissors" && computerPick === "paper");
          }

          const nextScores = { ...prev.scores };
          let nextWord = "";

          if (isTie) {
            nextWord = "TIE! TRY AGAIN...";
          } else {
            if (p1Wins) {
              nextScores.player += 1;
              nextWord = "YOU WIN ROUND!";
            } else {
              nextScores.computer += 1;
              nextWord = "COMPUTER WINS!";
            }
          }

          const isMatchOver = nextScores.player >= 2 || nextScores.computer >= 2;

          if (isMatchOver) {
            const playerWon = nextScores.player >= 2;
            nextWord = playerWon ? "YOU WINS MATCH!" : "COMPUTER WINS MATCH!";
            
            setTimeout(() => {
              setLocalGameData((f) => ({
                ...f,
                phase: "gameOver",
                isWinner: playerWon,
                isEliminated: !playerWon
              }));
            }, 2000);
          } else {
            // Next round
            setTimeout(() => {
              setLocalGameData((f) => ({
                ...f,
                phase: "pick",
                picks: {},
                results: {},
                reveal: false,
                animationWord: ""
              }));
            }, 2000);
          }

          return {
            ...prev,
            phase: "reveal",
            reveal: true,
            results: nextResults,
            scores: nextScores,
            animationWord: nextWord
          };
        });
      }
    };

    runAnimation();
  };

  const opponent = !isPractice ? players.find((p: any) => p.id !== myPlayer?.id) : null;
  const myScore = !isPractice ? (gameData.scores?.[myPlayer?.id] || 0) : 0;
  const opponentScore = !isPractice && opponent ? (gameData.scores?.[opponent.id] || 0) : 0;

  // Unified display bindings
  const displayReveal = isPractice ? localGameData.reveal : gameData.reveal;
  const displayResults = isPractice ? localGameData.results : gameData.results;
  const displayAnimationWord = isPractice ? localGameData.animationWord : gameData.animationWord;
  const displayIsAnimationPlaying = isPractice ? !!localGameData.animationWord : !!gameData.animationWord;
  const displayHasPicked = isPractice ? !!localGameData.picks.player : !!gameData.picks?.[myPlayer?.id];
  const displayMyPick = isPractice ? localGameData.results.player : gameData.results?.[myPlayer?.id];

  // Helper to determine the overlay card background dynamically
  const getOverlayBgColor = () => {
    const word = (displayAnimationWord || "").toUpperCase();
    if (word.includes("WIN") || word.includes("SHOOT")) {
      return "bg-emerald-400";
    }
    if (word.includes("TIE")) {
      return "bg-yellow-300";
    }
    if (word.includes("LOSE") || word.includes("COMPUTER")) {
      return "bg-red-400";
    }
    return "bg-cyan-400";
  };

  return (
    <View className="flex-1 items-center justify-center pt-2 w-full px-6">
      {/* HUD Scoreboard Card */}
      <View style={styles.hudWrapper} className="mb-8">
        {/* Shadow */}
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
          className={isDark ? "bg-white" : "bg-black"}
        />
        {/* Face */}
        <View
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 20,
            borderWidth: 4,
            borderColor: isDark ? "#ffffff" : "#000000",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateY: -4 }, { translateX: -4 }]
          }}
          className={isDark ? "bg-yellow-600" : "bg-yellow-300"}
        >
          <Text className="text-black font-black text-lg tracking-widest uppercase mb-1">
            {isPractice ? "PRACTICE MATCH" : "BEST OF 3"}
          </Text>
          <Text className="text-black font-black text-4xl">
            {isPractice 
              ? `${localGameData.scores.player} - ${localGameData.scores.computer}`
              : `${myScore} - ${opponentScore}`
            }
          </Text>
          <Text className="text-black/70 text-xs font-bold uppercase mt-1">
            {isPractice 
              ? "YOU vs COMPUTER" 
              : `${myPlayer?.name || "YOU"} vs ${opponent?.name || "OPPONENT"}`
            }
          </Text>
        </View>
      </View>

      <Text
        className={`text-xl font-black mb-8 text-center uppercase tracking-widest ${isDark ? "text-white" : "text-black"}`}
        style={{
          textShadowColor: isDark ? "#ec4899" : "#facc15",
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 0
        }}
      >
        CHOOSE YOUR WEAPON!
      </Text>

      {/* Choice Buttons Row */}
      <View className="flex-row justify-between w-full">
        {["rock", "paper", "scissors"].map((choice) => {
          const color = CHOICE_COLORS[choice];
          const isSelected = displayMyPick === choice;
          const isDisabled = displayHasPicked || displayIsAnimationPlaying;
          const isThisPressed = pressedChoice === choice;

          // If selected, keep it pressed down (translateY: 0), else float up (-6)
          const translateOffset = isSelected ? 0 : (!isDisabled && !isThisPressed ? -6 : 0);

          return (
            <View key={choice} style={styles.choiceWrapper} className={displayHasPicked && !isSelected ? 'opacity-40' : ''}>
              {/* Button Shadow */}
              <View
                style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                className={isDark ? "bg-white" : "bg-black"}
              />

              {/* Button Face */}
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => { if (!isDisabled) setPressedChoice(choice); }}
                onPressOut={() => setPressedChoice(null)}
                onPress={() => isPractice ? handleLocalPick(choice) : handlePick(choice)}
                disabled={isDisabled}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 24,
                  borderWidth: 4,
                  borderColor: isSelected ? "#eab308" : (isDark ? "#ffffff" : "#000000"),
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [
                    { translateY: translateOffset },
                    { translateX: translateOffset }
                  ]
                }}
                className={color.bg}
              >
                <Text className="text-black text-xs font-black uppercase mb-2">{choice}</Text>
                <View className="w-14 h-14 bg-black/10 rounded-2xl items-center justify-center">
                  <Text className="text-3xl">
                    {choice === 'rock' ? '✊' : choice === 'paper' ? '✋' : '✌️'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View className="mt-12 w-full items-center">
        {!displayIsAnimationPlaying && !displayHasPicked && (
          <Text className={`font-black text-sm uppercase tracking-widest ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>
            Waiting for your move...
          </Text>
        )}
        {!displayIsAnimationPlaying && displayHasPicked && (
          <Text className="text-yellow-500 font-black text-2xl uppercase tracking-widest">
            READY!
          </Text>
        )}
      </View>

      {/* Animation / Reveal Overlay */}
      <Modal visible={!!displayIsAnimationPlaying} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.8)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <View className="w-full max-w-sm relative">
            {/* Overlay Card Shadow */}
            <View
              style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
              className={isDark ? "bg-white" : "bg-black"}
            />

            {/* Overlay Card Body */}
            <View
              style={{
                borderRadius: 28,
                borderWidth: 4,
                borderColor: isDark ? "#ffffff" : "#000000",
                transform: [{ translateY: -6 }, { translateX: -6 }],
                paddingHorizontal: 24,
                paddingVertical: 36,
                alignItems: "center",
                width: "100%",
              }}
              className={getOverlayBgColor()}
            >
              <Text className="text-black font-black text-3xl text-center uppercase tracking-widest">
                {displayAnimationWord}
              </Text>

              {displayReveal && (
                <View className="mt-8 flex-row gap-6 justify-center items-center">
                  {isPractice ? (
                    <>
                      {/* Player Pick */}
                      <View style={styles.revealPickWrapper}>
                        <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} className="bg-black" />
                        <View
                          style={{
                            width: "100%",
                            height: 72,
                            borderRadius: 16,
                            borderWidth: 3,
                            borderColor: "#000000",
                            alignItems: "center",
                            justifyContent: "center",
                            transform: [{ translateY: -3 }, { translateX: -3 }]
                          }}
                          className={CHOICE_COLORS[displayResults.player]?.bg}
                        >
                          <Text className="text-3xl">
                            {displayResults.player === 'rock' ? '✊' : displayResults.player === 'paper' ? '✋' : '✌️'}
                          </Text>
                        </View>
                        <Text className="text-black font-black text-[10px] uppercase text-center mt-2">YOU</Text>
                      </View>

                      {/* Computer Pick */}
                      <View style={styles.revealPickWrapper}>
                        <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} className="bg-black" />
                        <View
                          style={{
                            width: "100%",
                            height: 72,
                            borderRadius: 16,
                            borderWidth: 3,
                            borderColor: "#000000",
                            alignItems: "center",
                            justifyContent: "center",
                            transform: [{ translateY: -3 }, { translateX: -3 }]
                          }}
                          className={CHOICE_COLORS[displayResults.computer]?.bg}
                        >
                          <Text className="text-3xl">
                            {displayResults.computer === 'rock' ? '✊' : displayResults.computer === 'paper' ? '✋' : '✌️'}
                          </Text>
                        </View>
                        <Text className="text-black font-black text-[10px] uppercase text-center mt-2">COMP</Text>
                      </View>
                    </>
                  ) : (
                    players.filter((p: any) => displayResults[p.id]).map((p: any) => {
                      const choice = displayResults[p.id];
                      return (
                        <View key={p.id} style={styles.revealPickWrapper}>
                          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} className="bg-black" />
                          <View
                            style={{
                              width: "100%",
                              height: 72,
                              borderRadius: 16,
                              borderWidth: 3,
                              borderColor: "#000000",
                              alignItems: "center",
                              justifyContent: "center",
                              transform: [{ translateY: -3 }, { translateX: -3 }]
                            }}
                            className={CHOICE_COLORS[choice]?.bg}
                          >
                            <Text className="text-3xl">
                              {choice === 'rock' ? '✊' : choice === 'paper' ? '✋' : '✌️'}
                            </Text>
                          </View>
                          <Text className="text-black font-black text-[10px] uppercase text-center mt-2" numberOfLines={1}>
                            {p.name}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hudWrapper: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  choiceWrapper: {
    width: "31%",
    aspectRatio: 0.9,
    position: "relative",
  },
  revealPickWrapper: {
    width: 80,
    position: "relative",
  }
});
