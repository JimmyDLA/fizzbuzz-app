import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

interface LobbyErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function LobbyErrorBanner({
  message,
  onDismiss,
}: LobbyErrorBannerProps) {
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  return (
    <View className="relative w-full mb-4">
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: 20, top: 4, left: 4 },
        ]}
        className={isDark ? "bg-white" : "bg-black"}
      />
      <View
        style={{
          borderRadius: 20,
          borderWidth: 4,
          borderColor: isDark ? "#ffffff" : "#000000",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
        className={isDark ? "bg-pink-500" : "bg-pink-300"}
      >
        <Text className="text-black text-base font-black uppercase text-center tracking-wide">
          {message}
        </Text>
        <TouchableOpacity onPress={onDismiss} className="mt-2 items-center">
          <Text className="text-black font-black text-xs tracking-widest uppercase">
            Dismiss
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
