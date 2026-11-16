import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { clearCardError } from "../store/lobbySlice";
import { RootState } from "../store/store";

const TOAST_MS = 2800;

export function CardErrorToast() {
  const dispatch = useDispatch();
  const cardError = useSelector((state: RootState) => state.lobby.cardError);

  useEffect(() => {
    if (!cardError) return;
    const haptic = Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning,
    );
    if (haptic && typeof haptic.catch === "function") {
      haptic.catch(() => {});
    }
    const timer = setTimeout(() => {
      dispatch(clearCardError());
    }, TOAST_MS);
    return () => clearTimeout(timer);
  }, [cardError, dispatch]);

  if (!cardError) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 64,
        left: 0,
        right: 0,
        zIndex: 100000,
        elevation: 100000,
        alignItems: "center",
        paddingHorizontal: 24,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => dispatch(clearCardError())}
        style={{ maxWidth: 420, width: "100%" }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            right: -4,
            bottom: -4,
            backgroundColor: "#000000",
            borderRadius: 16,
          }}
        />
        <View className="bg-amber-400 border-4 border-black rounded-2xl px-4 py-3">
          {cardError.cardId ? (
            <Text className="text-black font-black text-[10px] uppercase tracking-widest text-center">
              {cardError.cardId}
            </Text>
          ) : null}
          <Text className="text-black font-black text-xs uppercase tracking-wide text-center">
            {cardError.message}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
