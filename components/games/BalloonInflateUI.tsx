import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useGameData } from "./useGameData";

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

  const balloonColor = isMe ? "#fb7185" : "#22d3ee";
  const borderColor = isDark ? "#ffffff" : "#000000";

  return (
    <View style={[styles.balloonContainer, isMe && styles.myBalloonContainer]}>
      {isBurst ? (
        <LottieView
          source={require("../../assets/images/confetti.json")}
          autoPlay
          loop={false}
          style={{
            width: isMe ? 220 : 120,
            height: isMe ? 220 : 120,
            position: "absolute",
            top: isMe ? -40 : -20,
            zIndex: 30,
          }}
        />
      ) : (
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale }],
          }}
        >
          {/* Main Teardrop Balloon Body */}
          <View
            style={[
              styles.balloonBody,
              {
                backgroundColor: balloonColor,
                borderColor: borderColor,
              },
            ]}
          >
            {/* Specular Highlight Sheen */}
            <View style={styles.balloonHighlight} />
          </View>

          {/* Balloon Tied Knot */}
          <View
            style={[
              styles.balloonKnot,
              {
                backgroundColor: balloonColor,
                borderColor: borderColor,
              },
            ]}
          />

          {/* Balloon String */}
          <View
            style={[
              styles.balloonString,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(0,0,0,0.7)",
              },
            ]}
          />
        </Animated.View>
      )}
      <View
        style={[
          styles.nameTag,
          { borderColor: isDark ? "#ffffff" : "#000000" },
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
      {isWinner && (
        <MaterialCommunityIcons
          name="crown"
          size={24}
          color="#eab308"
          style={styles.winnerCrown}
        />
      )}
    </View>
  );
};

export function BalloonInflateUI() {
  const { players, selectedPlayers, myPlayer, sendAction } = useGameData();
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

  const selectedPlayersList = selectedPlayers || [];
  const otherPlayers = players.filter(
    (p: any) => p.id !== myPlayer?.id && selectedPlayersList.includes(p.id),
  );

  return (
    <View
      style={styles.container}
      className={isDark ? "bg-zinc-950" : "bg-green-500"}
    >
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
            transform: [{ translateY: -5 }, { translateX: -5 }],
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
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 80,
    paddingLeft: 20,
    paddingRight: 130, // Ensures opponent balloons wrap cleanly before reaching the pump slider
    gap: 14,
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
  balloonBody: {
    width: 48,
    height: 58,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 3,
    position: "relative",
    overflow: "hidden",
  },
  balloonHighlight: {
    position: "absolute",
    top: 6,
    left: 7,
    width: 10,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    transform: [{ rotate: "-25deg" }],
  },
  balloonKnot: {
    width: 10,
    height: 7,
    borderWidth: 2,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginTop: -2,
  },
  balloonString: {
    width: 2,
    height: 12,
    borderRadius: 1,
    marginTop: 0,
    marginBottom: 4,
  },
  burstIcon: {
    marginBottom: 20,
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
