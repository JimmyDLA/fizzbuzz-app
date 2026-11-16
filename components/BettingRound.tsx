import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { selectDisplayedGameType, selectRoundIsBetting } from "../store/selectors";
import { RootState } from "../store/store";
import {
  formatBetNet,
  formatBetRank,
  payoutBoard,
  refundNotice,
  wagerRows,
} from "../utils/betting";

const STAKE_PHASES = ["wheel", "countdown", "playing"];

function netTextClass(net: number, isDark: boolean, ink: string): string {
  if (net > 0) return isDark ? "text-emerald-300" : "text-emerald-700";
  if (net < 0) return isDark ? "text-rose-300" : "text-rose-600";
  return ink;
}

function useBettingTheme() {
  const lobby = useSelector((state: RootState) => state.lobby);
  return { lobby, isDark: lobby.theme === "dark" };
}

/**
 * Distinct from the Round X/N badge. It never repeats that label.
 */
export function BettingRoundMark({ className = "" }: { className?: string }) {
  const { isDark } = useBettingTheme();
  const betting = useSelector(selectRoundIsBetting);
  if (!betting) return null;

  return (
    <View
      className={`self-center px-4 py-1 rounded-full border-2 ${isDark ? "border-white bg-amber-400" : "border-black bg-yellow-300"} ${className}`}
    >
      <Text className="text-black font-black text-xs tracking-widest uppercase text-center">
        Betting round
      </Text>
    </View>
  );
}

/** Clear banner on the chart, before the spin. */
export function BettingRoundBanner() {
  const { lobby, isDark } = useBettingTheme();
  const betting = useSelector(selectRoundIsBetting);
  const modeLabel = useSelector(selectDisplayedGameType);
  if (!betting || lobby.gamePhase !== "chart") return null;

  return (
    <View className="w-full mb-4 relative">
      <View
        style={[StyleSheet.absoluteFillObject, { borderRadius: 24, top: 4, left: 4 }]}
        className={isDark ? "bg-white" : "bg-black"}
      />
      <View
        style={{
          borderRadius: 24,
          borderWidth: 4,
          borderColor: isDark ? "#ffffff" : "#000000",
          paddingHorizontal: 16,
          paddingVertical: 14,
          alignItems: "center",
        }}
        className={isDark ? "bg-amber-400" : "bg-yellow-300"}
      >
        <Text className="text-black text-2xl font-black uppercase text-center tracking-wider">
          Betting round
        </Text>
        <Text className="text-black font-black text-xs uppercase tracking-widest text-center mt-1">
          {modeLabel} · stake up to 3 points
        </Text>
      </View>
    </View>
  );
}

/** Pot and each player's wager once the wheel has started. */
export function BettingStakePanel({ wrapped = false }: { wrapped?: boolean }) {
  const { lobby, isDark } = useBettingTheme();
  if (!lobby.isBettingRound || !STAKE_PHASES.includes(lobby.gamePhase)) return null;

  const rows = wagerRows(lobby.players, lobby.selectedPlayers, lobby.bettingRound);
  const pot = Math.max(lobby.bettingPot, lobby.bettingRound?.pot ?? 0);
  const labelClass = isDark ? "text-yellow-300" : "text-black";
  const chipClass = isDark ? "border-white bg-zinc-800" : "border-black bg-white";
  const nameClass = isDark ? "text-white" : "text-black";

  const chips = rows.map((row) => {
    const player = lobby.players.find((candidate) => candidate.id === row.playerId);
    const net =
      player && player.betWager === row.wager ? player.betNet : -row.wager;
    return (
      <View
        key={row.playerId || row.name}
        className={`max-w-[150px] px-3 py-1.5 rounded-xl border-2 ${chipClass}`}
      >
        <Text className={`font-black text-xs uppercase ${nameClass}`} numberOfLines={1}>
          {row.name}
        </Text>
        <Text className={`font-black text-xs ${labelClass}`}>Wager {row.wager}</Text>
        <Text className={`font-black text-xs ${netTextClass(net, isDark, labelClass)}`}>
          Net {formatBetNet(net)}
        </Text>
      </View>
    );
  });

  return (
    <View className="w-full mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`font-black text-xs uppercase tracking-widest ${labelClass}`}>
          Pot
        </Text>
        <View className="bg-yellow-300 border-2 border-black px-3 py-0.5 rounded-full">
          <Text className="text-black font-black text-lg">{pot}</Text>
        </View>
      </View>
      <Text className={`font-black text-[10px] uppercase tracking-widest mb-2 ${labelClass}`}>
        Wagers
      </Text>
      {wrapped ? (
        <View className="flex-row flex-wrap gap-2">{chips}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pr-2">{chips}</View>
        </ScrollView>
      )}
    </View>
  );
}

/** Rank, wager, payout, and net after the round resolves. */
export function BettingPayoutBoard() {
  const { lobby, isDark } = useBettingTheme();
  const board = payoutBoard(
    lobby.bettingPayout,
    lobby.players,
    lobby.isBettingRound,
    lobby.bettingPot,
    lobby.bettingRefunded,
    lobby.gamePhase,
  );
  if (!board) return null;
  if (lobby.gamePhase === "lobby" || STAKE_PHASES.includes(lobby.gamePhase)) {
    return null;
  }

  const rows = [...board.payouts].sort((a, b) => {
    if (!board.refunded) {
      const rankA = a.rank > 0 ? a.rank : Number.POSITIVE_INFINITY;
      const rankB = b.rank > 0 ? b.rank : Number.POSITIVE_INFINITY;
      if (rankA !== rankB) return rankA - rankB;
    }
    return a.name.localeCompare(b.name);
  });
  const amountLabel = board.refunded ? "Refund" : "Payout";
  const notice = refundNotice(board, lobby.bettingRound);
  const ink = isDark ? "text-white" : "text-black";
  const muted = isDark ? "text-zinc-400" : "text-black/70";

  return (
    <View className="w-full mb-4 relative">
      <View
        style={[StyleSheet.absoluteFillObject, { borderRadius: 24, top: 4, left: 4 }]}
        className={isDark ? "bg-white" : "bg-black"}
      />
      <View
        style={{
          borderRadius: 24,
          borderWidth: 4,
          borderColor: isDark ? "#ffffff" : "#000000",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
        className={isDark ? "bg-zinc-900" : "bg-orange-50"}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className={`font-black text-lg uppercase tracking-wider ${ink}`}>Payout</Text>
          <View className="bg-yellow-300 border-2 border-black px-3 py-0.5 rounded-full">
            <Text className="text-black font-black text-sm uppercase">Pot {board.pot}</Text>
          </View>
        </View>

        {notice?.kind === "plain" && (
          <View className="bg-amber-300 border-2 border-black rounded-2xl px-3 py-2 mb-3">
            <Text className="text-black font-black text-sm uppercase text-center">
              {notice.title}
            </Text>
            <Text className="text-black font-bold text-xs text-center mt-1">{notice.detail}</Text>
          </View>
        )}

        {notice?.kind === "shared" && (
          <View className="bg-amber-300 border-2 border-black rounded-2xl px-3 py-2 mb-3">
            <Text className="text-black font-black text-sm text-center">{notice.message}</Text>
          </View>
        )}

        <View className="flex-row mb-1">
          <Text className={`w-8 font-black text-[10px] uppercase ${muted}`}>Rank</Text>
          <Text className={`flex-1 font-black text-[10px] uppercase ${muted}`}>Player</Text>
          <Text className={`w-14 text-right font-black text-[10px] uppercase ${muted}`}>Wager</Text>
          <Text className={`w-14 text-right font-black text-[10px] uppercase ${muted}`}>{amountLabel}</Text>
          <Text className={`w-12 text-right font-black text-[10px] uppercase ${muted}`}>Net</Text>
        </View>

        {rows.map((row) => (
          <View key={row.playerId || row.name} className="flex-row items-center py-1">
            <Text className={`w-8 font-black text-sm ${ink}`}>
              {formatBetRank(row.rank, board.refunded)}
            </Text>
            <Text className={`flex-1 font-black text-sm uppercase ${ink}`} numberOfLines={1}>
              {row.name}
            </Text>
            <Text className={`w-14 text-right font-black text-sm ${ink}`}>{row.wager}</Text>
            <Text className={`w-14 text-right font-black text-sm ${ink}`}>{row.payout}</Text>
            <Text className={`w-12 text-right font-black text-sm ${netTextClass(row.net, isDark, ink)}`}>
              {formatBetNet(row.net)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
