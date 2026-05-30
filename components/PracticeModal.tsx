import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { colyseusService } from "../store/colyseusService";
import { BalloonInflateUI } from "./games/BalloonInflateUI";
import { CycloneUI } from "./games/CycloneUI";
import { HotPotatoUI } from "./games/HotPotatoUI";
import { LumberCutUI } from "./games/LumberCutUI";
import { MathProblemUI } from "./games/MathProblemUI";
import { RockPaperScissorsUI } from "./games/RockPaperScissorsUI";
import { SimonSaysUI } from "./games/SimonSaysUI";
import { TappingRaceUI } from "./games/TappingRaceUI";
import { TriviaUI } from "./games/TriviaUI";
import { GameProvider } from "./games/useGameData";

export function PracticeModal({
  category,
  onClose,
}: {
  category: string;
  onClose: () => void;
}) {
  const practiceState = useSelector((state: any) => state.lobby.practiceState);
  const playerName = useSelector((state: any) => state.lobby.playerName);

  useEffect(() => {
    colyseusService.joinPractice(category, playerName);
    return () => {
      colyseusService.leavePractice();
    };
  }, []);

  const renderMiniGame = () => {
    switch (category) {
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
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      className="absolute top-0 left-0 w-full h-[130%] z-50 px-6 pb-32"
      style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
    >
      <View className="w-full flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-white text-3xl font-black italic tracking-widest text-emerald-400">
            PRACTICE
          </Text>
          <Text className="text-white/60 font-bold uppercase">{category}</Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="bg-red-500 w-12 h-12 rounded-full items-center justify-center border-4 border-red-700 shadow-xl"
        >
          <Text className="text-white font-black text-xl">X</Text>
        </TouchableOpacity>
      </View>

      {!practiceState ? (
        <View className="flex-1 justify-center items-center mb-32">
          <Text className="text-white font-bold animate-pulse text-lg uppercase tracking-widest opacity-50">
            Loading simulation...
          </Text>
        </View>
      ) : (
        <GameProvider isPractice={true}>
          <View className="flex-1 w-full relative mb-32">
            {practiceState.phase === "countdown" && (
              <View className="flex-1 justify-center items-center">
                <Text className="text-white font-black text-9xl">
                  {practiceState.timer}
                </Text>
              </View>
            )}
            {practiceState.phase === "playing" && (
              <>
                <View className="absolute top-0 right-0 bg-white/20 px-6 py-2 rounded-full border-4 border-white/30 z-50 shadow-lg">
                  <Text className="text-white font-black text-xl">
                    {practiceState.timer}s
                  </Text>
                </View>
                <View className="flex-1 w-full pt-16">{renderMiniGame()}</View>
              </>
            )}
            {practiceState.phase === "resolution" && (
              <View className="flex-1 justify-center items-center pb-20">
                <Text
                  className="text-white font-black text-6xl text-center mb-8 uppercase tracking-widest shadow-lg"
                  style={{
                    textShadowColor: "rgba(0,0,0,0.5)",
                    textShadowOffset: { width: 3, height: 3 },
                    textShadowRadius: 2,
                  }}
                >
                  FINISHED!
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  className="bg-emerald-500 px-8 py-5 rounded-[32px] border-8 border-emerald-700 shadow-2xl"
                >
                  <Text className="text-white font-black text-2xl uppercase tracking-wider">
                    BACK TO LOBBY
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GameProvider>
      )}
    </SafeAreaView>
  );
}
