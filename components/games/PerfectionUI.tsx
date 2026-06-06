import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameData } from './useGameData';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShapeProps {
  shapeIdx: number;
  size: number;
  color: string;
}

export function PerfectionShape({ shapeIdx, size, color }: ShapeProps) {
  const containerStyle = {
    width: size,
    height: size,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  switch (shapeIdx) {
    case 0: // Circle
      return (
        <View style={containerStyle}>
          <View style={{ width: size * 0.9, height: size * 0.9, borderRadius: (size * 0.9) / 2, backgroundColor: color }} />
        </View>
      );
    case 1: // Square
      return (
        <View style={containerStyle}>
          <View style={{ width: size * 0.85, height: size * 0.85, backgroundColor: color, borderRadius: 4 }} />
        </View>
      );
    case 2: // Triangle
      return (
        <View style={containerStyle}>
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.45,
            borderRightWidth: size * 0.45,
            borderBottomWidth: size * 0.85,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
          }} />
        </View>
      );
    case 3: // Rectangle
      return (
        <View style={containerStyle}>
          <View style={{ width: size * 0.95, height: size * 0.55, backgroundColor: color, borderRadius: 3 }} />
        </View>
      );
    case 4: // 5-point Star
      return (
        <View style={containerStyle}>
          <MaterialCommunityIcons name="star" size={size} color={color} />
        </View>
      );
    case 5: // Diamond
      return (
        <View style={containerStyle}>
          <View style={{
            width: size * 0.65,
            height: size * 0.65,
            backgroundColor: color,
            transform: [{ rotate: '45deg' }],
            borderRadius: 2,
          }} />
        </View>
      );
    case 6: // Hexagon
      return (
        <View style={containerStyle}>
          <MaterialCommunityIcons name="hexagon" size={size} color={color} />
        </View>
      );
    case 7: // Pentagon
      return (
        <View style={containerStyle}>
          <MaterialCommunityIcons name="pentagon" size={size} color={color} />
        </View>
      );
    case 8: // Cross
      return (
        <View style={containerStyle}>
          <View style={{ width: size * 0.85, height: size * 0.85, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: size * 0.85, height: size * 0.25, backgroundColor: color, borderRadius: 3 }} />
            <View style={{ position: 'absolute', width: size * 0.25, height: size * 0.85, backgroundColor: color, borderRadius: 3 }} />
          </View>
        </View>
      );
    case 9: // Oval
      return (
        <View style={containerStyle}>
          <View style={{
            width: size * 0.95,
            height: size * 0.6,
            borderRadius: (size * 0.6) / 2,
            backgroundColor: color,
          }} />
        </View>
      );
    case 10: // Trapezoid
      return (
        <View style={containerStyle}>
          <View style={{
            width: size * 0.45,
            height: 0,
            borderLeftWidth: size * 0.25,
            borderRightWidth: size * 0.25,
            borderBottomWidth: size * 0.8,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
          }} />
        </View>
      );
    case 11: // Heart
      return (
        <View style={containerStyle}>
          <MaterialCommunityIcons name="heart" size={size * 0.95} color={color} />
        </View>
      );
    case 12: // Shield
      return (
        <View style={containerStyle}>
          <MaterialCommunityIcons name="shield" size={size * 0.95} color={color} />
        </View>
      );
    case 13: // 6-point Star
      return (
        <View style={containerStyle}>
          <MaterialCommunityIcons name="hexagram" size={size} color={color} />
        </View>
      );
    case 14: // Arrow
      return (
        <View style={containerStyle}>
          <MaterialCommunityIcons name="arrow-up-bold" size={size} color={color} />
        </View>
      );
    case 15: // Parallelogram
      return (
        <View style={containerStyle}>
          <View style={{
            width: size * 0.7,
            height: size * 0.55,
            backgroundColor: color,
            transform: [{ skewX: '-20deg' }],
            borderRadius: 2,
          }} />
        </View>
      );
    default:
      return null;
  }
}

export function PerfectionUI() {
  const insets = useSafeAreaInsets();
  const { myPlayer, sendAction } = useGameData();

  let gameData: any = {};
  try {
    gameData = JSON.parse(myPlayer?.gameData || "{}");
  } catch (e) { }

  const shapes = gameData.shapes || [];

  const [matchedShapes, setMatchedShapes] = useState<number[]>([]);
  const [boardLayout, setBoardLayout] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [draggingShape, setDraggingShape] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  const boardRef = useRef<View>(null);
  const containerRef = useRef<View>(null);
  const [containerPagePos, setContainerPagePos] = useState({ x: 0, y: 0 });
  const dragPosRef = useRef({ x: 0, y: 0 });

  // Reset matched shapes on a new game/round when the shape layout changes
  const shapesJoined = shapes.join(',');
  useEffect(() => {
    setMatchedShapes([]);
  }, [shapesJoined]);

  const measureLayouts = useCallback(() => {
    boardRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (width > 0) {
        setBoardLayout({ x: pageX, y: pageY, width, height });
      }
    });
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (width > 0) {
        setContainerPagePos({ x: pageX, y: pageY });
      }
    });
  }, []);

  const onContainerLayout = useCallback(() => {
    // Short delay to let native positions settle
    setTimeout(measureLayouts, 200);
  }, [measureLayouts]);

  const checkHit = useCallback((absX: number, absY: number, shapeIndex: number) => {
    if (!boardLayout || shapes.length === 0) return;

    const slotIdx = shapes.indexOf(shapeIndex);
    if (slotIdx === -1) return;

    const row = Math.floor(slotIdx / 4);
    const col = slotIdx % 4;
    const slotSize = boardLayout.width / 4;

    const slotX = boardLayout.x + col * slotSize;
    const slotY = boardLayout.y + row * slotSize;

    // Bounding check with small tolerance padding
    const tolerance = slotSize * 0.15;
    const isHit =
      absX >= slotX - tolerance &&
      absX <= slotX + slotSize + tolerance &&
      absY >= slotY - tolerance &&
      absY <= slotY + slotSize + tolerance;

    if (isHit) {
      import('expo-haptics').then(({ default: Haptics }) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }).catch(() => {});

      setMatchedShapes(prev => [...prev, shapeIndex]);
      sendAction({ action: 'place' });
    } else {
      import('expo-haptics').then(({ default: Haptics }) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }).catch(() => {});
    }
  }, [boardLayout, shapes, sendAction]);

  const remainingShapes = Array.from({ length: 16 }, (_, i) => i)
    .filter(idx => !matchedShapes.includes(idx));

  return (
    <View 
      ref={containerRef}
      onLayout={onContainerLayout}
      style={styles.container}
    >
      {/* Header Info */}
      <View className="items-center mt-2 mb-6">
        <Text className="text-white text-5xl font-black font-rounded text-center tracking-wider">
          {matchedShapes.length} / 16
        </Text>
        <Text className="text-indigo-300 font-bold text-sm tracking-widest uppercase">
          Shapes Matched
        </Text>
      </View>

      {/* 4x4 Grid Board */}
      <View 
        ref={boardRef}
        onLayout={measureLayouts}
        className="w-full aspect-square bg-slate-900/60 border-[6px] border-indigo-900/80 rounded-[32px] p-3 shadow-2xl flex-row flex-wrap justify-between"
      >
        {shapes.length > 0 ? (
          shapes.map((shapeIdx: number, idx: number) => {
            const isMatched = matchedShapes.includes(shapeIdx);
            return (
              <View 
                key={idx}
                className={`w-[23%] aspect-square items-center justify-center rounded-2xl mb-[2%] ${
                  isMatched 
                    ? 'bg-emerald-500/10 border-[3px] border-emerald-500/40 shadow-md shadow-emerald-500/10' 
                    : 'bg-black/40 border-2 border-indigo-950/60 border-dashed'
                }`}
              >
                <PerfectionShape 
                  shapeIdx={shapeIdx} 
                  size={isMatched ? 40 : 32} 
                  color={isMatched ? '#FBBF24' : 'rgba(165, 180, 252, 0.15)'} 
                />
              </View>
            );
          })
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-indigo-300 font-bold text-lg">Loading Board...</Text>
          </View>
        )}
      </View>

      {/* Instruction */}
      <View className="my-4 items-center">
        <Text className="text-indigo-200/80 font-bold text-xs uppercase tracking-widest text-center">
          Hold & drag shapes from the tray to their match!
        </Text>
      </View>

      {/* Bottom Slider / Tray */}
      <View className="w-full h-24 bg-indigo-950/40 rounded-3xl border-2 border-white/10 p-3 items-center justify-center mb-4">
        {remainingShapes.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 4, alignItems: 'center' }}
          >
            {remainingShapes.map((shapeIdx) => {
              const panGesture = Gesture.Pan()
                .runOnJS(true)
                .minDistance(0)
                .onStart((e) => {
                  if (gameData.finished) return;
                  measureLayouts();
                  setDraggingShape(shapeIdx);
                  setDragPos({ x: e.absoluteX, y: e.absoluteY });
                  dragPosRef.current = { x: e.absoluteX, y: e.absoluteY };
                })
                .onUpdate((e) => {
                  setDragPos({ x: e.absoluteX, y: e.absoluteY });
                  dragPosRef.current = { x: e.absoluteX, y: e.absoluteY };
                })
                .onEnd((e) => {
                  checkHit(dragPosRef.current.x, dragPosRef.current.y, shapeIdx);
                  setDraggingShape(null);
                });

              return (
                <GestureDetector key={shapeIdx} gesture={panGesture}>
                  <View className="w-16 h-16 bg-white/10 rounded-2xl border-2 border-white/20 items-center justify-center active:scale-95 shadow-md">
                    <PerfectionShape shapeIdx={shapeIdx} size={36} color="#FBBF24" />
                  </View>
                </GestureDetector>
              );
            })}
          </ScrollView>
        ) : (
          <Text className="text-emerald-400 font-black text-xl uppercase tracking-widest text-center">
            PERFECT!
          </Text>
        )}
      </View>

      {/* Floating Active Dragging Overlay */}
      {draggingShape !== null && (
        <View 
          pointerEvents="none"
          style={[
            styles.dragOverlay,
            {
              left: dragPos.x - containerPagePos.x - 32,
              top: dragPos.y - containerPagePos.y - 32,
            }
          ]}
        >
          <PerfectionShape shapeIdx={draggingShape} size={50} color="#FBBF24" />
        </View>
      )}

      {/* Game Over / Win Overlay */}
      {gameData.finished && (
        <View className="absolute inset-0 bg-black/70 items-center justify-center z-50 rounded-[40px]">
          <Text className="text-white text-5xl font-black uppercase text-center shadow-2xl font-rounded">
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
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  dragOverlay: {
    position: 'absolute',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  }
});
