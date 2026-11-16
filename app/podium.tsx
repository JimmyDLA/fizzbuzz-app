import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RetroButton } from "../components/RetroButton";
import { RoundBadge } from "../components/RoundBadge";
import { memphisShapes } from "../constants/theme";
import { colyseusService } from "../store/colyseusService";
import { RootState } from "../store/store";
import { placeTitle, podiumColumns } from "../utils/rounds";

const PEDESTAL_HEIGHT: Record<number, number> = {
  1: 108,
  2: 76,
  3: 52,
};

const PLACE_COLOR: Record<number, string> = {
  1: "bg-yellow-400",
  2: "bg-zinc-200",
  3: "bg-orange-400",
};

export default function PodiumScreen() {
  const { podium, roundCount, totalRounds, playerName, theme, gamePhase } = useSelector(
    (state: RootState) => state.lobby,
  );
  const isDark = theme === "dark";
  const columns = podiumColumns(podium);

  const goHome = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace("/");
    colyseusService.leaveAfterGameOver();
  };

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

  return (
    <SafeAreaView
      style={StyleSheet.absoluteFillObject}
      className={`${isDark ? "bg-zinc-950" : "bg-amber-50"}`}
    >
      {renderBackgroundDebris()}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <LottieView
          source={require("../assets/images/confetti.json")}
          autoPlay
          loop={false}
          style={{ width: "100%", height: "70%" }}
        />
      </View>

      <View className="flex-1 px-5 pt-4">
        <View className="items-center mb-4">
          <Text
            className={`text-4xl font-black uppercase tracking-widest text-center ${isDark ? "text-white" : "text-black"}`}
            style={{
              textShadowColor: isDark ? "#facc15" : "#f472b6",
              textShadowOffset: { width: 3, height: 3 },
              textShadowRadius: 0,
            }}
          >
            Game over
          </Text>
          <RoundBadge
            phase={gamePhase}
            roundCount={roundCount}
            totalRounds={totalRounds}
            isDark={isDark}
            className="mt-3"
          />
        </View>

        {columns.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text
              className={`font-black text-xl uppercase tracking-widest text-center ${isDark ? "text-white" : "text-black"}`}
            >
              No standings
            </Text>
          </View>
        ) : (
          <View className="flex-1 flex-row items-end justify-center gap-2 pb-4">
            {columns.map((column) => {
              const tied = column.players.length > 1;
              const wide = columns.length === 1;
              return (
                <View
                  key={column.place}
                  className={`h-full justify-end ${wide ? "w-48" : "flex-1"}`}
                >
                  <Text
                    className={`text-center font-black tracking-widest uppercase ${column.place === 1 ? "text-lg" : "text-sm"} ${isDark ? "text-yellow-300" : "text-black"}`}
                  >
                    {placeTitle(column.place)}
                  </Text>
                  {tied ? (
                    <Text
                      className={`text-center font-black text-[10px] tracking-widest uppercase mb-2 ${isDark ? "text-pink-400" : "text-pink-600"}`}
                    >
                      {column.place === 1 ? "Co-winners" : "Tie"}
                    </Text>
                  ) : (
                    <View className="mb-2" />
                  )}
                  <ScrollView
                    style={{ maxHeight: 220, flexGrow: 0 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 8 }}
                  >
                    {column.players.map((player) => {
                      const isMe = player.name === playerName;
                      return (
                        <View key={player.playerId} className="items-center mb-2 px-1">
                          <Text
                            numberOfLines={2}
                            className={`font-black text-center uppercase ${isMe ? "text-pink-500" : isDark ? "text-white" : "text-black"} ${column.place === 1 ? "text-base" : "text-sm"}`}
                          >
                            {player.name}
                            {isMe ? " (YOU)" : ""}
                          </Text>
                          <Text
                            className={`font-black text-xs tracking-wider ${isDark ? "text-zinc-400" : "text-black/60"}`}
                          >
                            {player.score} PTS
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                  <View
                    style={{
                      height: PEDESTAL_HEIGHT[column.place] ?? 52,
                      borderRadius: 16,
                      borderWidth: 3,
                      borderColor: isDark ? "#ffffff" : "#000000",
                    }}
                    className={PLACE_COLOR[column.place] ?? "bg-white"}
                  />
                </View>
              );
            })}
          </View>
        )}

        <View className="pb-4 pt-2">
          <RetroButton title="HOME" variant="primary" onPress={goHome} />
        </View>
      </View>
    </SafeAreaView>
  );
}
