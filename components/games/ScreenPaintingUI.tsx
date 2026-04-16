import {
  Canvas,
  PaintStyle,
  Path,
  Skia,
  SkPath,
  StrokeCap,
  StrokeJoin
} from '@shopify/react-native-skia';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Performance Note: Checking every pixel on a 50x50 grid (2500 pixels) is fast.
const CHECK_SIZE = 50;
const REFRESH_RATE = 500; // ms

const COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#A855F7", // Purple
  "#EC4899", // Pink
];

export function ScreenPaintingUI() {
  const insets = useSafeAreaInsets();
  const { players, playerName } = useSelector((state: any) => state.lobby);
  const myPlayer = players.find((p: any) => p.name === playerName);

  const [paths, setPaths] = useState<SkPath[]>([]);
  const currentPath = useRef<SkPath | null>(null);
  const lastCheckTime = useRef<number>(0);
  const isFinished = useRef(false);

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) { }

  const myColor = COLORS[gameData.colorIndex ?? 0] ?? COLORS[0];

  // Layout calculations considering SafeArea
  const canvasWidth = SCREEN_WIDTH;
  const canvasHeight = SCREEN_HEIGHT - insets.top - insets.bottom;

  const checkCoverage = useCallback(() => {
    if (isFinished.current) return;

    try {
      // 1. Create a tiny offscreen surface
      const surface = Skia.Surface.MakeOffscreen(CHECK_SIZE, CHECK_SIZE);
      if (!surface) return;
      const smallCanvas = surface.getCanvas();

      // 2. Clear with full transparency (hex format required by RN Skia)
      smallCanvas.clear(Skia.Color('#00000000'));

      // 3. Draw all current paths into the small canvas, scaled down
      smallCanvas.save();
      smallCanvas.scale(CHECK_SIZE / canvasWidth, CHECK_SIZE / canvasHeight);

      const paint = Skia.Paint();
      paint.setColor(Skia.Color(myColor));
      paint.setStrokeWidth(60); // Thick brush
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);

      paths.forEach(p => {
        smallCanvas.drawPath(p, paint);
      });

      // If there's an active path being drawn, include it
      if (currentPath.current) {
        smallCanvas.drawPath(currentPath.current, paint);
      }

      smallCanvas.restore();

      // 4. Analyze pixels
      const snapshot = surface.makeImageSnapshot();
      const pixels = snapshot.readPixels(0, 0, {
        width: CHECK_SIZE,
        height: CHECK_SIZE,
        alphaType: 3, // Unpremul
        colorType: 4, // RGBA_8888
      });

      if (pixels) {
        let opaqueCount = 0;
        const totalPixels = CHECK_SIZE * CHECK_SIZE;

        // Alpha is at index 3, 7, 11, ...
        for (let i = 3; i < pixels.length; i += 4) {
          if (pixels[i] > 200) { // Threshold for "painted"
            opaqueCount++;
          }
        }

        const coverage = opaqueCount / totalPixels;

        // 98% coverage threshold for better UX (accounting for small gaps/corners)
        if (coverage > 0.96) {
          isFinished.current = true;
          colyseusService.sendGameAction({ action: 'finished' });
        }
      }
    } catch (e) {
      console.warn("Coverage check failed:", e);
    }
  }, [paths, canvasWidth, canvasHeight, myColor]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onStart((e) => {
      if (isFinished.current) return;
      const path = Skia.Path.Make();
      path.moveTo(e.x, e.y);
      currentPath.current = path;
    })
    .onUpdate((e) => {
      if (isFinished.current || !currentPath.current) return;
      currentPath.current.lineTo(e.x, e.y);

      // Update UI (expensive if too frequent, but Skia handles paths well)
      // Throttle coverage check during active drawing
      const now = Date.now();
      if (now - lastCheckTime.current > REFRESH_RATE) {
        lastCheckTime.current = now;
        // Trigger a re-render to show the path progress
        setPaths(prev => [...prev]);
      }
    })
    .onEnd(() => {
      if (currentPath.current) {
        setPaths(prev => [...prev, currentPath.current!]);
        currentPath.current = null;
        checkCoverage();
      }
    });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <View style={[styles.canvasWrapper, { marginTop: insets.top, marginBottom: insets.bottom }]}>
          <Canvas
            style={styles.canvas}
          >
            {paths.map((p, i) => (
              <Path
                key={i}
                path={p}
                color={myColor}
                style="stroke"
                strokeWidth={60}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}
            {/* Active path is rendered in the next frame anyway via touchHandler's state update trigger if we wanted, 
              but for Skia it's better to just keep it in paths for the render loop */}
          </Canvas>
        </View>
      </GestureDetector>

      <View pointerEvents="none" style={styles.overlay}>
        <Text className="text-white/20 text-4xl font-black text-center uppercase rotate-12">PAINT EVERYWHERE!</Text>
      </View>

      {gameData.finished && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <Text className="text-white text-6xl font-black uppercase text-center shadow-2xl">
            {gameData.winnerId === myPlayer?.id ? "YOU WIN!" : "FINISHED!"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  canvasWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Whitespace to be covered
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
