import { Text, View } from "react-native";
import { roundLabel } from "../utils/rounds";

interface RoundBadgeProps {
  roundCount: number;
  totalRounds: number;
  isDark?: boolean;
  className?: string;
}

export function RoundBadge({
  roundCount,
  totalRounds,
  isDark = false,
  className = "",
}: RoundBadgeProps) {
  const label = roundLabel(roundCount, totalRounds);
  if (!label) return null;

  return (
    <View
      className={`self-center px-4 py-1 rounded-full border-2 ${isDark ? "border-white bg-yellow-400" : "border-black bg-yellow-300"} ${className}`}
    >
      <Text className="text-black font-black text-xs tracking-widest uppercase text-center">
        {label}
      </Text>
    </View>
  );
}
