import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NUM_LIGHTS = 50;
const SPEED_MS = 1500; // ms per full rotation
const TARGET_INDEX = 0; // Top dead center
const ARC = (Math.PI * 2) / NUM_LIGHTS;
const CENTER_Y = SCREEN_WIDTH * 0.55;
const CENTER_X = SCREEN_WIDTH * 0.5;
const RADIUS = SCREEN_WIDTH * 0.38;

interface BulbProps {
  index: number;
  activeIndex: Animated.SharedValue<number>;
  stoppedIndex: number | null;
}

// Bulb component for performance isolation
const Bulb = ({ index, activeIndex, stoppedIndex }: BulbProps) => {
  const angle = index * ARC - Math.PI / 2; // Start at top
  const cx = CENTER_X + RADIUS * Math.cos(angle);
  const cy = CENTER_Y + RADIUS * Math.sin(angle);

  const isTarget = index === TARGET_INDEX;

  const style = useAnimatedStyle(() => {
    let color = isTarget ? '#3B82F6' : '#334155'; // Default inactive (yellow target, gray others)
    let scale = 1;

    // Use stopped index if the player hit stop, otherwise use the live spinning index
    const currentActive = stoppedIndex !== null ? stoppedIndex : Math.floor(activeIndex.value) % NUM_LIGHTS;

    if (currentActive === index) {
      color = isTarget ? '#59ff00ff' : '#FCD34D'; // Green if stopped on target, Blue otherwise
      scale = 1.3;
    }

    return {
      backgroundColor: color,
      transform: [{ scale }],
      shadowColor: color,
      shadowOpacity: currentActive === index ? 0.8 : 0,
      shadowRadius: 10,
    };
  });

  return (
    <Animated.View
      style={[
        styles.bulb,
        { left: cx - 8, top: cy - 8 },
        style
      ]}
    />
  );
};

export function CycloneUI() {
  const { players, playerName } = useSelector((state: any) => state.lobby);
  const myPlayer = players.find((p: any) => p.name === playerName);

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) { }

  const activeIndex = useSharedValue(0);
  const [localStop, setLocalStop] = useState<number | null>(null);

  useEffect(() => {
    // Start spinning
    activeIndex.value = 0;
    activeIndex.value = withRepeat(
      withTiming(NUM_LIGHTS, { duration: SPEED_MS, easing: Easing.linear }),
      -1,
      false
    );

    return () => cancelAnimation(activeIndex);
  }, []);

  // When game finishes (server timeout or all stopped), hardcode to stoppedIndex if it wasn't captured locally
  useEffect(() => {
    if (gameData.finished && localStop === null && gameData.stoppedIndex !== null) {
      setLocalStop(gameData.stoppedIndex);
    }
  }, [gameData.finished, gameData.stoppedIndex]);

  const handleStop = () => {
    if (localStop !== null || gameData.finished) return; // Already stopped

    // Capture precise visually rendered index
    const currentIndex = Math.floor(activeIndex.value) % NUM_LIGHTS;
    cancelAnimation(activeIndex);
    activeIndex.value = currentIndex; // Freeze
    setLocalStop(currentIndex);

    colyseusService.sendGameAction({ action: 'stop', index: currentIndex });
  };

  const bulbs = [];
  for (let i = 0; i < NUM_LIGHTS; i++) {
    bulbs.push(<Bulb key={i} index={i} activeIndex={activeIndex} stoppedIndex={localStop} />);
  }

  // Find out who won from results if finished
  let message = "WAITING FOR OTHERS...";
  if (gameData.finished && gameData.results) {
    const myResult = gameData.results.find((r: any) => r.id === myPlayer?.id);
    const bestDist = Math.min(...gameData.results.map((r: any) => r.distance));

    if (bestDist === 999) {
      message = "TOO SLOW! EVERYONE LOSES!";
    } else if (myResult?.distance === bestDist) {
      if (bestDist === 0) message = "BULLSEYE! YOU WIN!";
      else message = `CLOSEST! (Missed by ${bestDist})`;
    } else {
      message = myResult?.distance === 999
        ? "YOU LOSE! (TOO SLOW)"
        : `YOU LOSE! (Missed by ${myResult?.distance})`;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
        {bulbs}

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.stopButton, (localStop !== null || gameData.finished) && styles.stopButtonDisabled]}
          onPress={handleStop}
          disabled={localStop !== null || gameData.finished}
        >
          <Text style={styles.buttonText}>STOP</Text>
        </TouchableOpacity>
      </View>

      {(localStop !== null || gameData.finished) && (
        <View style={styles.lockedArea}>
          <Text style={styles.resultText}>{message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#26d04bff', // dark slate
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameArea: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.1,
    position: 'relative',
  },
  bulb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stopButton: {
    position: 'absolute',
    top: CENTER_Y - 50,
    left: CENTER_X - 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EF4444',
    borderWidth: 6,
    borderColor: '#7F1D1D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  stopButtonDisabled: {
    backgroundColor: '#475569',
    borderColor: '#1E293B',
    shadowOpacity: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  lockedArea: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resultText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  }
});
