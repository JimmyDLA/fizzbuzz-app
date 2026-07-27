import Slider from "@react-native-community/slider";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import * as Haptics from "expo-haptics";
import { useGameData } from "./useGameData";
import { RootState } from "../../store/store";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const Balloon = ({
  size,
  name,
  isMe,
  isBurst,
  isWinner,
  isDark,
}: {
  size: number;
  name: string;
  isMe: boolean;
  isBurst: boolean;
  isWinner: boolean;
  isDark: boolean;
}) => {
  // Base scale is 0.5 (size 0), grows to 2.5 (size 100)
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isBurst ? 0 : 0.5 + (size / 100) * (isMe ? 2.5 : 1.5),
      useNativeDriver: true,
      bounciness: 12,
    }).start();
  }, [size, isBurst, isMe, scale]);

  return (
    <View style={[styles.balloonContainer, isMe && styles.myBalloonContainer]}>
      {isBurst ? (
        <Text style={[{ fontSize: isMe ? 80 : 40 }, styles.burstIcon]}>💥</Text>
      ) : (
        <Animated.View
          style={[
            styles.balloon,
            isMe ? styles.myBalloonColor : styles.otherBalloonColor,
            {
              transform: [{ scale }],
              borderColor: isDark ? "#ffffff" : "#000000"
            },
          ]}
        />
      )}
      <View
        style={[
          styles.nameTag,
          { borderColor: isDark ? "#ffffff" : "#000000" }
        ]}
        className={isDark ? "bg-zinc-800" : "bg-white"}
      >
        <Text
          style={styles.balloonName}
          className={isDark ? "text-white" : "text-black"}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={styles.balloonSize} className="text-yellow-600">
          {size}%
        </Text>
      </View>
      {isWinner && <Text style={styles.winnerCrown}>👑</Text>}
    </View>
  );
};

export function BalloonInflateUI() {
  const { players, myPlayer, sendAction } = useGameData();
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const [pumpState, setPumpState] = useState("down");

  const onSliderChange = (val: number) => {
    if (gameData.finished) return;

    // Pump mechanic: Drag all the way UP (1.0), then slash all the way DOWN (0.0)
    if (val < 0.2 && pumpState === "up") {
      setPumpState("down");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      sendAction({ action: "pump" });
    } else if (val > 0.8 && pumpState === "down") {
      setPumpState("up");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) {}

  const otherPlayers = players.filter((p: any) => p.id !== myPlayer?.id);

  let message = "";
  if (gameData.finished) {
    if (
      gameData.winnerId === myPlayer?.id ||
      gameData.timeoutWinners?.includes(myPlayer?.id)
    ) {
      message = "YOU WIN!";
    } else {
      message = "YOU LOSE!";
    }
  }

  return (
    <View style={styles.container} className={isDark ? "bg-zinc-950" : "bg-green-500"}>
      {/* Top area: Opponent balloons */}
      <View style={styles.opponentsRow}>
        {otherPlayers.map((p: any) => {
          let pData: any = {};
          try {
            pData = JSON.parse(p.gameData || "{}");
          } catch (e) {}
          const isWinner =
            gameData.finished &&
            (gameData.winnerId === p.id ||
              gameData.timeoutWinners?.includes(p.id));
          return (
            <Balloon
              key={p.id}
              name={p.name}
              size={pData.size || 0}
              isMe={false}
              isBurst={pData.burst || isWinner} // if winner, it burst
              isWinner={isWinner}
              isDark={isDark}
            />
          );
        })}
      </View>

      {/* Center: My balloon */}
      <View style={styles.myBalloonZone}>
        <Balloon
          name={"ME"}
          size={gameData.size || 0}
          isMe={true}
          isBurst={
            gameData.burst ||
            (gameData.finished &&
              (gameData.winnerId === myPlayer?.id ||
                gameData.timeoutWinners?.includes(myPlayer?.id)))
          }
          isWinner={
            gameData.finished &&
            (gameData.winnerId === myPlayer?.id ||
              gameData.timeoutWinners?.includes(myPlayer?.id))
          }
          isDark={isDark}
        />
      </View>

      {/* Right area: Pump Slider Card */}
      <View style={styles.pumpWrapper}>
        {/* PUMP! Label on top of the slider */}
        <Text
          className={`font-black text-lg tracking-widest uppercase text-center`}
          style={{
            position: "absolute",
            top: -35,
            left: 0,
            right: 0,
            color: isDark ? "#ffffff" : "#000000",
          }}
        >
          PUMP!
        </Text>

        {/* Shadow */}
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]}
          className={isDark ? "bg-white" : "bg-black"}
        />
        {/* Card Body */}
        <View
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 32,
            borderWidth: 4,
            borderColor: isDark ? "#ffffff" : "#000000",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateY: -5 }, { translateX: -5 }]
          }}
          className={isDark ? "bg-yellow-600" : "bg-yellow-300"}
        >
          <View style={styles.sliderWrapper}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor="#000000"
              maximumTrackTintColor="#f43f5e" // Represents the compressed pump pink
              thumbTintColor="#e11d48"
              onValueChange={onSliderChange}
              disabled={gameData.finished}
              value={0}
            />
          </View>
        </View>
      </View>

      {/* Winner/Loser Overlay Card */}
      {gameData.finished && (
        <View style={StyleSheet.absoluteFillObject} className="justify-center items-center px-6 z-50 bg-black/75">
          <View className="w-full max-w-sm relative">
            {/* Shadow */}
            <View
              style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
              className={isDark ? "bg-white" : "bg-black"}
            />
            {/* Body */}
            <View
              style={{
                borderRadius: 28,
                borderWidth: 4,
                borderColor: isDark ? "#ffffff" : "#000000",
                transform: [{ translateY: -6 }, { translateX: -6 }],
                paddingHorizontal: 24,
                paddingVertical: 36,
                alignItems: "center",
              }}
              className={message === "YOU WIN!" ? "bg-emerald-400" : "bg-red-400"}
            >
              <Text className="text-black font-black text-4xl text-center uppercase tracking-widest">
                {message}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  opponentsRow: {
    flex: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 40,
    gap: 20,
  },
  myBalloonZone: {
    position: "absolute",
    left: 20,
    bottom: 100,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.5,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  balloonContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 20,
    width: 60,
    height: 120, // allows room to grow upward
  },
  myBalloonContainer: {
    width: 150,
    height: 250,
  },
  balloon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 3,
  },
  burstIcon: {
    marginBottom: 20,
  },
  myBalloonColor: {
    backgroundColor: "#fb7185", // Pink balloon
  },
  otherBalloonColor: {
    backgroundColor: "#22d3ee", // Cyan balloon
  },
  nameTag: {
    marginTop: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
    width: "120%",
    borderWidth: 2,
  },
  balloonName: {
    fontWeight: "900",
    fontSize: 10,
    textTransform: "uppercase",
  },
  balloonSize: {
    fontWeight: "bold",
    fontSize: 12,
  },
  winnerCrown: {
    position: "absolute",
    top: -20,
    fontSize: 24,
  },
  pumpWrapper: {
    position: "absolute",
    right: 20,
    bottom: 40,
    width: 100,
    height: SCREEN_HEIGHT * 0.6,
  },
  sliderWrapper: {
    width: SCREEN_HEIGHT * 0.5,
    height: 60,
    transform: [{ rotate: "-90deg" }],
    justifyContent: "center",
    alignItems: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
});
