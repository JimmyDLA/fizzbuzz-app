import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useGameData } from "./useGameData";

export function SimonSaysUI() {
  const { timer, myPlayer, sendAction, isPractice } = useGameData();
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const [gameData, setGameData] = useState<any>(null);
  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null);

  // Local state for Practice Mode
  const [localGameData, setLocalGameData] = useState<{
    phase: "watch" | "input" | "gameOver";
    sequence: number[];
    currentRound: number;
    progress: number;
    isWinner: boolean;
    isEliminated: boolean;
  }>({
    phase: "watch",
    sequence: [],
    currentRound: 1,
    progress: 0,
    isWinner: false,
    isEliminated: false,
  });

  const [localTimer, setLocalTimer] = useState(10);

  const startLocalGame = () => {
    const firstColor = Math.floor(Math.random() * 4);
    setLocalGameData({
      phase: "watch",
      sequence: [firstColor],
      currentRound: 1,
      progress: 0,
      isWinner: false,
      isEliminated: false,
    });
    setLocalTimer(10);
  };

  // Initialize local practice game
  useEffect(() => {
    if (isPractice) {
      startLocalGame();
    }
  }, [isPractice]);

  // Flash local sequence during 'watch' phase in practice mode
  useEffect(() => {
    if (
      isPractice &&
      localGameData.phase === "watch" &&
      localGameData.sequence.length > 0
    ) {
      let isCancelled = false;

      const playLocalSequence = async () => {
        setActiveColorIndex(null);
        await new Promise((r) => setTimeout(r, 1000));

        const round = localGameData.currentRound;
        const speedFactor = Math.max(0.4, 1 - (round - 1) * 0.15);
        const onDuration = Math.round(600 * speedFactor);
        const offDuration = Math.round(300 * speedFactor);

        for (let i = 0; i < localGameData.sequence.length; i++) {
          if (isCancelled) return;
          setActiveColorIndex(localGameData.sequence[i]);
          await new Promise((r) => setTimeout(r, onDuration));

          if (isCancelled) return;
          setActiveColorIndex(null);
          await new Promise((r) => setTimeout(r, offDuration));
        }

        if (isCancelled) return;
        setLocalGameData((prev) => ({ ...prev, phase: "input", progress: 0 }));
        setLocalTimer(10); // Reset round timer
      };

      playLocalSequence();
      return () => {
        isCancelled = true;
        setActiveColorIndex(null);
      };
    }
  }, [isPractice, localGameData.phase, localGameData.sequence]);

  // Local timer countdown for input phase in practice mode
  useEffect(() => {
    if (isPractice && localGameData.phase === "input") {
      const interval = setInterval(() => {
        setLocalTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            setLocalGameData((prev) => ({
              ...prev,
              phase: "gameOver",
              isEliminated: true,
            }));
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPractice, localGameData.phase]);

  // Parse game state for multiplayer mode
  useEffect(() => {
    if (!isPractice && myPlayer?.gameData) {
      try {
        setGameData(JSON.parse(myPlayer.gameData));
      } catch (e) {}
    }
  }, [myPlayer?.gameData, isPractice]);

  // Flash sequence during 'watch' phase in multiplayer mode
  useEffect(() => {
    if (!isPractice && gameData?.phase === "watch" && gameData?.sequence) {
      let isCancelled = false;

      const playSequence = async () => {
        await new Promise((r) => setTimeout(r, 1000));

        const round = gameData.currentRound || 1;
        const speedFactor = Math.max(0.4, 1 - (round - 1) * 0.15);
        const onDuration = Math.round(500 * speedFactor);
        const offDuration = Math.round(250 * speedFactor);

        for (let i = 0; i < gameData.sequence.length; i++) {
          if (isCancelled) return;
          setActiveColorIndex(gameData.sequence[i]);
          await new Promise((r) => setTimeout(r, onDuration));

          if (isCancelled) return;
          setActiveColorIndex(null);
          await new Promise((r) => setTimeout(r, offDuration));
        }
      };

      playSequence();

      return () => {
        isCancelled = true;
        setActiveColorIndex(null);
      };
    } else if (!isPractice) {
      setActiveColorIndex(null);
    }
  }, [gameData?.phase, gameData?.sequence, isPractice]);

  const handleTap = (color: number) => {
    if (gameData?.phase !== "input") return;
    if (!gameData.activePlayers.includes(myPlayer?.id)) return;

    setActiveColorIndex(color);
    setTimeout(() => setActiveColorIndex(null), 150);

    sendAction({ action: "tap", color });
  };

  const handleLocalTap = (color: number) => {
    if (localGameData.phase !== "input") return;

    setActiveColorIndex(color);
    setTimeout(() => setActiveColorIndex(null), 150);

    const expected = localGameData.sequence[localGameData.progress];
    if (color === expected) {
      const nextProgress = localGameData.progress + 1;
      if (nextProgress === localGameData.sequence.length) {
        if (localGameData.currentRound === 5) {
          setLocalGameData((prev) => ({
            ...prev,
            phase: "gameOver",
            progress: nextProgress,
            isWinner: true,
          }));
        } else {
          setTimeout(() => {
            const nextColor = Math.floor(Math.random() * 4);
            setLocalGameData((prev) => ({
              ...prev,
              phase: "watch",
              currentRound: prev.currentRound + 1,
              sequence: [...prev.sequence, nextColor],
              progress: 0,
            }));
          }, 800);
        }
      } else {
        setLocalGameData((prev) => ({
          ...prev,
          progress: nextProgress,
        }));
      }
    } else {
      setLocalGameData((prev) => ({
        ...prev,
        phase: "gameOver",
        isEliminated: true,
      }));
    }
  };

  const colorConfigs = [
    {
      idx: 0,
      colorName: "green",
      normalClass: "bg-emerald-500",
      activeClass: "bg-emerald-400",
      glowColor: "#10b981",
      borderRadiusClass: "rounded-tl-full",
      marginClass: "mr-1 mb-1",
    },
    {
      idx: 1,
      colorName: "red",
      normalClass: "bg-rose-500",
      activeClass: "bg-rose-400",
      glowColor: "#f43f5e",
      borderRadiusClass: "rounded-tr-full",
      marginClass: "ml-1 mb-1",
    },
    {
      idx: 2,
      colorName: "yellow",
      normalClass: "bg-yellow-500",
      activeClass: "bg-yellow-400",
      glowColor: "#eab308",
      borderRadiusClass: "rounded-bl-full",
      marginClass: "mr-1 mt-1",
    },
    {
      idx: 3,
      colorName: "blue",
      normalClass: "bg-blue-500",
      activeClass: "bg-blue-400",
      glowColor: "#3b82f6",
      borderRadiusClass: "rounded-br-full",
      marginClass: "ml-1 mt-1",
    },
  ];

  if (!isPractice && !gameData) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDark ? "bg-zinc-950" : "bg-green-500"}`}
      >
        <Text
          className={`font-black text-2xl uppercase tracking-widest ${isDark ? "text-white" : "text-black"}`}
        >
          LOADING SIMON...
        </Text>
      </View>
    );
  }

  const isEliminated =
    !isPractice && !gameData?.activePlayers?.includes(myPlayer?.id);
  const isWinner =
    !isPractice &&
    gameData?.isGameOver &&
    gameData?.winners?.includes(myPlayer?.id);
  const progress = !isPractice ? gameData?.progress?.[myPlayer?.id] || 0 : 0;

  // Unified display bindings
  const displayPhase = isPractice ? localGameData.phase : gameData?.phase;
  const displayRound = isPractice
    ? localGameData.currentRound
    : gameData?.currentRound;
  const displaySequenceLength = isPractice
    ? localGameData.sequence.length
    : gameData?.sequence?.length || 0;
  const displayProgress = isPractice ? localGameData.progress : progress;
  const displayIsEliminated = isPractice
    ? localGameData.isEliminated
    : isEliminated;
  const displayIsWinner = isPractice ? localGameData.isWinner : isWinner;
  const displayTimer = isPractice ? localTimer : timer;
  const displayTap = isPractice ? handleLocalTap : handleTap;

  return (
    <View
      className={`flex-1 items-center justify-between w-full px-6 py-8 ${isDark ? "bg-zinc-950" : "bg-green-500"}`}
    >
      {/* HUD */}
      <View className="items-center w-full mt-2">
        {/* SCORE CARD */}
        <View style={styles.hudCardWrapper} className="mb-6">
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
              transform: [{ translateY: -4 }, { translateX: -4 }],
            }}
            className={isDark ? "bg-yellow-600" : "bg-yellow-300"}
          >
            <Text className="text-black font-black text-lg tracking-widest uppercase">
              SCORE
            </Text>
            <Text className="text-black font-black text-3xl font-mono">
              {displayProgress}
            </Text>
          </View>
        </View>

        {/* Phase State Badge */}
        {(() => {
          let badgeBg = "bg-cyan-400";
          let badgeText = "SIMON SAYS...";
          if (displayIsWinner) {
            badgeBg = "bg-emerald-400";
            badgeText = "WINNER!";
          } else if (displayIsEliminated) {
            badgeBg = "bg-red-400";
            badgeText = "ELIMINATED!";
          } else if (displayPhase === "input") {
            badgeBg = "bg-yellow-300";
            badgeText = "YOUR TURN";
          }
          return (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 3,
                borderColor: isDark ? "#ffffff" : "#000000",
                paddingHorizontal: 16,
                paddingVertical: 6,
              }}
              className={badgeBg}
            >
              <Text className="text-black font-black text-lg uppercase tracking-wider text-center">
                {badgeText}
              </Text>
            </View>
          );
        })()}

        {!displayIsEliminated && displayPhase === "input" ? (
          <Text
            className={`font-black text-sm uppercase mt-4 h-7 tracking-widest ${isDark ? "text-zinc-400" : "text-black"}`}
          >
            Sequence: {displayProgress} / {displaySequenceLength}
          </Text>
        ) : (
          <View className="h-7 mt-4" />
        )}
      </View>

      {/* Circular Simon Says Board */}
      <View
        style={{ width: 280, height: 280 }}
        className="relative justify-center items-center my-6"
      >
        {/* Outer Wheel Container */}
        <View
          style={{ borderRadius: 140 }}
          className="w-full h-full bg-zinc-950 p-2 relative flex-row flex-wrap justify-between content-between shadow-2xl"
        >
          {colorConfigs.map((c) => {
            const isActive = activeColorIndex === c.idx;
            return (
              <TouchableOpacity
                key={c.idx}
                activeOpacity={0.85}
                onPress={() => displayTap(c.idx)}
                disabled={displayPhase !== "input" || displayIsEliminated}
                style={[
                  {
                    width: "48%",
                    height: "48%",
                  },
                  isActive
                    ? {
                        shadowColor: c.glowColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.9,
                        shadowRadius: 25,
                        elevation: 15,
                        zIndex: 10,
                        transform: [{ scale: 1.03 }],
                      }
                    : {},
                ]}
                className={`${isActive ? c.activeClass : c.normalClass} ${c.borderRadiusClass} ${c.marginClass}`}
              />
            );
          })}
        </View>

        {/* Central Black Button with Timer */}
        <View
          style={{
            position: "absolute",
            width: 86,
            height: 86,
            borderRadius: 43,
            borderWidth: 6,
            borderColor: "#09090b", // zinc-950
            backgroundColor: "#18181b", // zinc-900
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 10,
          }}
        >
          {displayPhase === "input" && (
            <Text className="text-white text-3xl font-black font-mono">
              {displayTimer}
            </Text>
          )}
        </View>
      </View>

      {/* Survivor Count / Info Card */}
      <View style={styles.survivorCardWrapper} className="mb-4">
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
          className={isDark ? "bg-zinc-800" : "bg-white"}
        >
          <Text
            className={`font-black text-xs uppercase text-center tracking-wider ${isDark ? "text-white" : "text-black"}`}
            numberOfLines={1}
          >
            {isPractice
              ? `ROUND ${displayRound} / 5 — PRACTICE`
              : `ROUND ${displayRound} — Survivors: ${gameData.activePlayers.length}`}
          </Text>
        </View>
      </View>

      {displayIsEliminated && (
        <View className="absolute inset-0 bg-red-900/20 pointer-events-none rounded-[40px]" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hudCardWrapper: {
    width: "60%",
    height: 76,
    position: "relative",
  },
  survivorCardWrapper: {
    width: "90%",
    height: 48,
    position: "relative",
  },
});
