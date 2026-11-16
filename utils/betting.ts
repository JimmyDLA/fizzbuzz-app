import type {
  BettingPayoutEvent,
  BettingPayoutReason,
  BettingRoundEvent,
  BettingWagerView,
  LobbyPlayer,
} from "../store/lobbySlice";

/** Battle Royale is spelled out on a betting round. Other rounds keep the short code. */
export function displayMode(gameType: string, isBettingRound: boolean): string {
  if (isBettingRound && (gameType === "BR" || gameType === "BATTLE ROYALE")) {
    return "BATTLE ROYALE";
  }
  return gameType;
}

export function formatBetNet(net: number): string {
  if (net > 0) return `+${net}`;
  return `${net}`;
}

/** Second line under "All wagers were returned." */
export function refundReasonCopy(reason: BettingPayoutReason): string {
  switch (reason) {
    case "no-action":
      return "Nobody won this round.";
    case "aborted":
      return "The round was aborted.";
    case "unresolved":
      return "The round ended before a result.";
    case "payout":
      return "The pot was sent back.";
  }
}

export function wagerRows(
  players: Pick<LobbyPlayer, "id" | "name" | "betWager">[],
  selectedPlayers: string[],
  bettingRound: BettingRoundEvent | null,
): BettingWagerView[] {
  if (bettingRound && bettingRound.wagers.length > 0) {
    return bettingRound.wagers;
  }
  const selected = new Set(selectedPlayers);
  return players
    .filter((player) => selected.has(player.id))
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      wager: player.betWager,
    }));
}

/**
 * Prefer the broadcast. A late joiner missed it, so the resolution screen
 * rebuilds the same rows from the schema fields.
 */
export function payoutBoard(
  bettingPayout: BettingPayoutEvent | null,
  players: LobbyPlayer[],
  isBettingRound: boolean,
  bettingPot: number,
  bettingRefunded: boolean,
  phase: string,
): BettingPayoutEvent | null {
  if (bettingPayout) return bettingPayout;
  if (!isBettingRound) return null;
  if (phase !== "resolution" && phase !== "gameover") return null;

  const involved = players.filter(
    (player) =>
      player.betWager !== 0 ||
      player.betPayout !== 0 ||
      player.betNet !== 0 ||
      player.betRank !== 0,
  );
  if (involved.length === 0 && !bettingRefunded) return null;

  return {
    roundCount: 0,
    pot: bettingPot,
    refunded: bettingRefunded,
    reason: bettingRefunded ? "no-action" : "payout",
    payouts: involved.map((player) => ({
      playerId: player.id,
      name: player.name,
      wager: player.betWager,
      payout: player.betPayout,
      net: player.betNet,
      rank: player.betRank,
    })),
  };
}

/** Net chip for the chart scoreboard. Hidden on the chart before the wheel starts. */
export function displayedBetNet(
  player: Pick<LobbyPlayer, "id" | "betWager" | "betPayout" | "betNet" | "betRank">,
  options: {
    isBettingRound: boolean;
    phase: string;
    bettingRound: BettingRoundEvent | null;
    bettingPayout: BettingPayoutEvent | null;
  },
): number | null {
  const { isBettingRound, phase, bettingRound, bettingPayout } = options;
  if (bettingPayout) {
    const row = bettingPayout.payouts.find((payout) => payout.playerId === player.id);
    if (row) return row.net;
  }
  if (!isBettingRound || phase === "chart" || phase === "lobby") return null;
  const listed = bettingRound?.wagers.some((wager) => wager.playerId === player.id) ?? false;
  const involved =
    listed ||
    player.betWager !== 0 ||
    player.betPayout !== 0 ||
    player.betNet !== 0 ||
    player.betRank !== 0;
  if (!involved) return null;
  return player.betNet;
}
