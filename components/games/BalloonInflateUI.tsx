import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Balloon = ({ size, name, isMe, isBurst, isWinner }: { size: number, name: string, isMe: boolean, isBurst: boolean, isWinner: boolean }) => {
  // Base scale is 0.5 (size 0), grows to 2.5 (size 100)
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isBurst ? 0 : 0.5 + (size / 100) * (isMe ? 2.5 : 1.5),
      useNativeDriver: true,
      bounciness: 12,
    }).start();
  }, [size, isBurst]);

  return (
    <View style={[styles.balloonContainer, isMe && styles.myBalloonContainer]}>
      {isBurst ? (
        <Text style={[{ fontSize: isMe ? 80 : 40 }, styles.burstIcon]}>💥</Text>
      ) : (
        <Animated.View style={[
          styles.balloon,
          isMe ? styles.myBalloonColor : styles.otherBalloonColor,
          { transform: [{ scale }] }
        ]}
        />
      )}
      <View style={styles.nameTag}>
        <Text style={styles.balloonName} numberOfLines={1}>{name}</Text>
        <Text style={styles.balloonSize}>{size}%</Text>
      </View>
      {isWinner && <Text style={styles.winnerCrown}>👑</Text>}
    </View>
  );
};

export function BalloonInflateUI() {
  const { players, playerName } = useSelector((state: any) => state.lobby);
  const myPlayer = players.find((p: any) => p.name === playerName);

  let gameData: any = {};
  try { gameData = JSON.parse(myPlayer?.gameData || "{}"); } catch (e) { }

  const [pumpState, setPumpState] = useState("down");

  const onSliderChange = (val: number) => {
    if (gameData.finished) return;

    // Pump mechanic: Drag all the way UP (1.0), then slash all the way DOWN (0.0)
    if (val < 0.2 && pumpState === "up") {
      setPumpState("down");
      colyseusService.sendGameAction({ action: 'pump' });
    } else if (val > 0.8 && pumpState === "down") {
      setPumpState("up");
    }
  };

  const otherPlayers = players.filter((p: any) => p.id !== myPlayer?.id);

  let message = "";
  if (gameData.finished) {
    if (gameData.winnerId === myPlayer?.id || gameData.timeoutWinners?.includes(myPlayer?.id)) {
      message = "YOU WIN!";
    } else {
      message = "YOU LOSE!";
    }
  }

  return (
    <View style={styles.container}>
      {/* Top area: Opponent balloons */}
      <View style={styles.opponentsRow}>
        {otherPlayers.map((p: any) => {
          let pData: any = {};
          try { pData = JSON.parse(p.gameData || "{}"); } catch (e) { }
          const isWinner = gameData.finished && (gameData.winnerId === p.id || gameData.timeoutWinners?.includes(p.id));
          return (
            <Balloon
              key={p.id}
              name={p.name}
              size={pData.size || 0}
              isMe={false}
              isBurst={pData.burst || isWinner} // if winner, it burst
              isWinner={isWinner}
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
          isBurst={gameData.burst || (gameData.finished && (gameData.winnerId === myPlayer?.id || gameData.timeoutWinners?.includes(myPlayer?.id)))}
          isWinner={gameData.finished && (gameData.winnerId === myPlayer?.id || gameData.timeoutWinners?.includes(myPlayer?.id))}
        />
      </View>

      {/* Right area: Pump Slider */}
      <View style={styles.pumpArea}>
        <Text style={styles.pumpHint}>PUMP!</Text>
        <View style={styles.sliderWrapper}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#FCA5A5" // Represents the compressed pump
            thumbTintColor="#EF4444"
            onValueChange={onSliderChange}
            disabled={gameData.finished}
            value={0}
          />
        </View>
      </View>

      {gameData.finished && (
        <View style={styles.resultOverlay}>
          <Text style={styles.resultText}>{message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
  },
  opponentsRow: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 40,
    gap: 20,
  },
  myBalloonZone: {
    position: 'absolute',
    left: 20,
    bottom: 100,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.5,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  balloonContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    borderRadius: 30, // acts as oval
    marginBottom: 10,
    // Add balloon string
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  burstIcon: {
    marginBottom: 20,
  },
  myBalloonColor: {
    backgroundColor: '#EF4444', // Red balloon
    shadowColor: '#EF4444',
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  otherBalloonColor: {
    backgroundColor: '#3B82F6', // Blue balloon
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  nameTag: {
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    width: '120%',
  },
  balloonName: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 10,
  },
  balloonSize: {
    color: '#FCD34D',
    fontWeight: 'bold',
    fontSize: 12,
  },
  winnerCrown: {
    position: 'absolute',
    top: -20,
    fontSize: 24,
  },
  pumpArea: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 100,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pumpHint: {
    color: '#FCA5A5',
    fontWeight: '900',
    fontSize: 20,
    position: 'absolute',
    top: -30,
    letterSpacing: 2,
  },
  sliderWrapper: {
    width: SCREEN_HEIGHT * 0.5,
    height: 60,
    transform: [{ rotate: '-90deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  resultText: {
    color: 'white',
    fontSize: 60,
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
  }
});
