import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useGameData } from "./useGameData";

export function SimonSaysUI() {
  const { timer, myPlayer, sendAction } = useGameData();

  const [gameData, setGameData] = useState<any>(null);
  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null);

  // Parse game state
  useEffect(() => {
    if (myPlayer?.gameData) {
      try {
        setGameData(JSON.parse(myPlayer.gameData));
      } catch (e) {}
    }
  }, [myPlayer?.gameData]);

  // Flash sequence during 'watch' phase
  useEffect(() => {
    if (gameData?.phase === "watch") {
      let isCancelled = false;

      const playSequence = async () => {
        // Brief pause before starting the sequence
        await new Promise((r) => setTimeout(r, 1000));

        for (let i = 0; i < gameData.sequence.length; i++) {
          if (isCancelled) return;
          setActiveColorIndex(gameData.sequence[i]);
          await new Promise((r) => setTimeout(r, 500));

          if (isCancelled) return;
          setActiveColorIndex(null);
          await new Promise((r) => setTimeout(r, 250));
        }
      };

      playSequence();

      return () => {
        isCancelled = true;
        setActiveColorIndex(null);
      };
    } else {
      setActiveColorIndex(null);
    }
  }, [gameData?.phase, gameData?.sequence]);

  const handleTap = (color: number) => {
    if (gameData?.phase !== "input") return;
    if (!gameData.activePlayers.includes(myPlayer?.id)) return;

    // Provide instant local feedback
    setActiveColorIndex(color);
    setTimeout(() => setActiveColorIndex(null), 150);

    sendAction({ action: "tap", color });
  };

  const colors = [
    {
      idx: 0,
      bg: "bg-red-500",
      border: "border-red-700",
      activeBg: "bg-red-300",
    },
    {
      idx: 1,
      bg: "bg-purple-500",
      border: "border-purple-700",
      activeBg: "bg-purple-300",
    },
    {
      idx: 2,
      bg: "bg-blue-500",
      border: "border-blue-700",
      activeBg: "bg-blue-300",
    },
    {
      idx: 3,
      bg: "bg-yellow-500",
      border: "border-yellow-700",
      activeBg: "bg-yellow-300",
    },
  ];

  if (!gameData) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-white font-black text-2xl">LOADING SIMON...</Text>
      </View>
    );
  }

  const isEliminated = !gameData.activePlayers.includes(myPlayer?.id);
  const isWinner = gameData.isGameOver && gameData.winners?.includes(myPlayer?.id);
  const progress = gameData.progress?.[myPlayer?.id] || 0;

  return (
    <View className="flex-1 items-center justify-between w-full px-4 py-12">
      {/* HUD */}
      <View className="items-center">
        <Text className="text-white/60 font-bold text-lg uppercase tracking-widest mb-1">
          ROUND {gameData.currentRound}
        </Text>

        {isWinner ? (
          <Text className="text-yellow-400 font-black text-4xl mb-2 flex-shrink-0 text-center">
            WINNER!
          </Text>
        ) : isEliminated ? (
          <Text className="text-red-500 font-black text-4xl mb-2 flex-shrink-0 text-center">
            ELIMINATED!
          </Text>
        ) : gameData.phase === "watch" ? (
          <Text className="text-cyan-300 font-black text-4xl mb-2 flex-shrink-0 text-center">
            WATCH SIMON
          </Text>
        ) : (
          <Text className="text-emerald-400 font-black text-4xl mb-2 flex-shrink-0 text-center">
            YOUR TURN
          </Text>
        )}

        <View className="bg-black/40 px-6 py-2 rounded-full mt-2">
          <Text className="text-white font-mono text-xl font-bold">
            00:{timer.toString().padStart(2, "0")}
          </Text>
        </View>

        {!isEliminated && gameData.phase === "input" ? (
          <Text className="text-white/80 font-bold text-lg mt-4 h-7">
            Progress: {progress} / {gameData.sequence.length}
          </Text>
        ) : (
          <View className="h-7 mt-4" />
        )}
      </View>

      {/* Buttons Grid */}
      <View className="w-full max-w-sm aspect-square flex-row flex-wrap gap-4 justify-center items-center opacity-100 my-4">
        {colors.map((c) => {
          const isActive = activeColorIndex === c.idx;
          return (
            <TouchableOpacity
              key={c.idx}
              activeOpacity={0.7}
              onPress={() => handleTap(c.idx)}
              disabled={gameData.phase !== "input" || isEliminated}
              className={`w-[45%] aspect-square rounded-[32px] border-b-[8px] justify-center items-center ${
                isActive
                  ? c.activeBg + " border-b-0 mt-2"
                  : c.bg + " " + c.border
              }`}
            >
              <View
                className={`absolute inset-0 rounded-[32px] bg-white ${isActive ? "opacity-30" : "opacity-0"}`}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Survivor Count */}
      <View className="items-center mb-4">
        <Text className="text-white/50 font-bold text-lg uppercase">
          Survivors: {gameData.activePlayers.length}
        </Text>
      </View>

      {isEliminated && (
        <View className="absolute inset-0 bg-red-900/40 pointer-events-none" />
      )}
    </View>
  );
}
