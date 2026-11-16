import * as Haptics from "expo-haptics";
import { useRef, useState, type ComponentRef } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { colyseusService } from "../store/colyseusService";
import { RootState } from "../store/store";
import {
  ROUND_CHOICES,
  RoundChoice,
  coerceRoundChoice,
} from "../utils/rounds";
import { RetroButton } from "./RetroButton";

const ITEM_HEIGHT = 64;
const WHEEL_HEIGHT = ITEM_HEIGHT * 3;

export function RoundsPicker({ isHost }: { isHost: boolean }) {
  const { totalRounds, theme, matchLengthSupported } = useSelector((state: RootState) => state.lobby);
  const isDark = theme === "dark";
  const shown = coerceRoundChoice(totalRounds);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RoundChoice>(shown);
  const draftRef = useRef<RoundChoice>(shown);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const initialIndex = Math.max(0, ROUND_CHOICES.indexOf(draft));

  const openPicker = () => {
    const initial = coerceRoundChoice(totalRounds);
    draftRef.current = initial;
    setDraft(initial);
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);
  };

  const previewOffset = (y: number) => {
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.min(ROUND_CHOICES.length - 1, Math.max(0, index));
    const next = ROUND_CHOICES[clamped];
    if (draftRef.current !== next) {
      draftRef.current = next;
      void Haptics.selectionAsync();
      setDraft(next);
    }
    return clamped;
  };

  const commitOffset = (y: number) => {
    const clamped = previewOffset(y);
    const target = clamped * ITEM_HEIGHT;
    if (Math.abs(y - target) > 1) {
      scrollRef.current?.scrollTo({ y: target, animated: true });
    }
  };

  const selectChoice = (choice: RoundChoice) => {
    const index = ROUND_CHOICES.indexOf(choice);
    if (draftRef.current !== choice) {
      draftRef.current = choice;
      void Haptics.selectionAsync();
      setDraft(choice);
    }
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  };

  const confirm = () => {
    colyseusService.sendSetRounds(draftRef.current);
    setOpen(false);
  };

  if (!matchLengthSupported) return null;

  return (
    <View className="w-full mb-4">
      {isHost ? (
        <Pressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={`Rounds, ${shown}. Opens the match length picker.`}
        >
          <RoundsValue
            isDark={isDark}
            rounds={shown}
            hint="TAP TO CHANGE"
          />
        </Pressable>
      ) : (
        <RoundsValue isDark={isDark} rounds={shown} hint="HOST'S PICK" />
      )}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View className="flex-1 bg-black/80 justify-center px-6">
          <View className="w-full max-w-sm self-center relative">
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { borderRadius: 28, top: 8, left: 8 },
              ]}
              className={isDark ? "bg-white" : "bg-black"}
            />
            <View
              style={{
                borderRadius: 28,
                borderWidth: 4,
                borderColor: isDark ? "#ffffff" : "#000000",
                padding: 20,
              }}
              className={isDark ? "bg-zinc-900" : "bg-amber-50"}
            >
              <Text
                className={`text-center text-2xl font-black uppercase tracking-widest ${isDark ? "text-white" : "text-black"}`}
              >
                How many rounds
              </Text>
              <Text
                className={`text-center font-black text-xs tracking-widest uppercase mt-1 mb-2 ${isDark ? "text-yellow-300" : "text-black/60"}`}
              >
                Scroll to choose
              </Text>

              <View style={{ height: WHEEL_HEIGHT }} className="w-full my-2">
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: ITEM_HEIGHT,
                    height: ITEM_HEIGHT,
                    left: 12,
                    right: 12,
                    borderRadius: 16,
                  }}
                  className="bg-yellow-300"
                />
                {open ? (
                  <ScrollView
                    ref={scrollRef}
                    style={{ height: WHEEL_HEIGHT, backgroundColor: "transparent" }}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    disableIntervalMomentum
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                    contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
                    onScroll={(event) =>
                      previewOffset(event.nativeEvent.contentOffset.y)
                    }
                    onMomentumScrollEnd={(event) =>
                      commitOffset(event.nativeEvent.contentOffset.y)
                    }
                    onScrollEndDrag={(event) => {
                      const velocity = event.nativeEvent.velocity?.y ?? 0;
                      if (Math.abs(velocity) < 0.05) {
                        commitOffset(event.nativeEvent.contentOffset.y);
                      }
                    }}
                  >
                    {ROUND_CHOICES.map((choice) => {
                      const selected = choice === draft;
                      return (
                        <Pressable
                          key={choice}
                          onPress={() => selectChoice(choice)}
                          style={{ height: ITEM_HEIGHT }}
                          className="items-center justify-center"
                          accessibilityRole="button"
                          accessibilityLabel={`${choice} rounds`}
                          accessibilityState={{ selected }}
                        >
                          <Text
                            className={`font-black ${selected ? "text-black text-4xl" : isDark ? "text-white/35 text-2xl" : "text-black/30 text-2xl"}`}
                          >
                            {choice}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: ITEM_HEIGHT,
                    height: ITEM_HEIGHT,
                    left: 12,
                    right: 12,
                    borderRadius: 16,
                    borderWidth: 4,
                    borderColor: isDark ? "#ffffff" : "#000000",
                    zIndex: 5,
                  }}
                />
              </View>

              <Text
                className={`text-center font-black tracking-widest uppercase mb-4 ${isDark ? "text-yellow-300" : "text-black"}`}
              >
                {draft} rounds
              </Text>
              <RetroButton title="SET ROUNDS" variant="success" onPress={confirm} />
              <RetroButton title="CANCEL" variant="danger" onPress={closePicker} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RoundsValue({
  isDark,
  rounds,
  hint,
}: {
  isDark: boolean;
  rounds: number;
  hint: string;
}) {
  return (
    <View className="relative w-full">
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: 18, top: 4, left: 4 },
        ]}
        className={isDark ? "bg-white" : "bg-black"}
      />
      <View
        style={{
          borderRadius: 18,
          borderWidth: 3,
          borderColor: isDark ? "#ffffff" : "#000000",
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className={isDark ? "bg-zinc-800" : "bg-white"}
      >
        <Text
          className={`font-black tracking-widest uppercase text-sm ${isDark ? "text-yellow-300" : "text-black/60"}`}
        >
          Rounds
        </Text>
        <Text
          className={`font-black text-3xl ${isDark ? "text-white" : "text-black"}`}
        >
          {rounds}
        </Text>
        <Text
          className={`font-black tracking-wider uppercase text-[10px] ${isDark ? "text-zinc-400" : "text-black/50"}`}
        >
          {hint}
        </Text>
      </View>
    </View>
  );
}
