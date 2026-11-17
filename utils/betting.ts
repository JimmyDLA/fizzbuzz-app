import type {
  BettingPayoutEvent,
  BettingPayoutReason,
  BettingRoundEvent,
  BettingWagerView,
  LobbyPlayer,
} from "../store/lobbySlice";
import { visibleRoundNumber } from "./rounds";

/**
 * Fields that decide the mode label for the round on screen.
 * `currentGameType` can still say "1v1" or "2v2" on the chart before a
 * betting round, because the server does not clear it until the wheel starts.
 */
export interface GameTypeSource {
  phase: string;
  roundCount: number;
  currentGameType: string;
  /** Server `LobbyState.isBettingRound`, when the room already computed it. */
  isBettingRound: boolean;
  /** `BettingRoundEvent`, sent when that round's wheel first starts. */
  bettingRound: Pick<BettingRoundEvent, "roundCount" | "mode"> | null;
}

/**
 * Same rule as the server: a betting round is a positive multiple of 5.
 * Round 0 and anything that is not a whole number are not betting rounds.
 */
export function isBettingRoundNumber(roundNumber: number): boolean {
  return Number.isInteger(roundNumber) && roundNumber > 0 && roundNumber % 5 === 0;
}

/**
 * The round whose mode is on screen.
 * Chart, wheel, countdown, and playing show `roundCount + 1`.
 * Resolution and game over show `roundCount`. The lobby has no round.
 */
export function displayedRoundNumber(phase: string, roundCount: number): number | null {
  return visibleRoundNumber(phase, roundCount);
}

/**
 * True when the round on screen is a betting round, so the label is Battle Royale
 * no matter what `currentGameType` still says.
 *
 * Chart, wheel, countdown, playing, resolution, and game over use the round
 * number, the same way the server does: a positive multiple of 5. A stale
 * `isBettingRound` or `BettingRoundEvent` from the previous round cannot
 * relabel this one. The lobby has no round number, so there the server flag
 * or a `BettingRoundEvent` is used when the room has already sent one.
 */
export function roundIsBetting(source: GameTypeSource): boolean {
  const shown = displayedRoundNumber(source.phase, source.roundCount);
  if (shown != null) return isBettingRoundNumber(shown);
  if (source.isBettingRound) return true;
  return source.bettingRound != null && source.bettingRound.mode === "BR";
}

/**
 * Mode label for the round on screen.
 * A betting round is always "BATTLE ROYALE". Any other round keeps the short code
 * the server stored (`1v1`, `2v2`, or `BR`).
 */
export function displayedGameType(source: GameTypeSource): string {
  return displayMode(source.currentGameType, roundIsBetting(source));
}

/** Battle Royale is spelled out on a betting round. Other rounds keep the short code. */
export function displayMode(gameType: string, isBettingRound: boolean): string {
  if (isBettingRound) return "BATTLE ROYALE";
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

export type RefundNotice =
  | { kind: "plain"; title: string; detail: string }
  | { kind: "shared"; message: string };

/**
 * A refund where someone still gained points is a leaver's stake shared out.
 * The leaver is omitted from the payout, so the name comes from the wager list.
 * A plain refund, with every net at 0, keeps the original copy.
 */
export function refundNotice(
  board: Pick<BettingPayoutEvent, "refunded" | "reason" | "payouts">,
  bettingRound: BettingRoundEvent | null,
): RefundNotice | null {
  if (!board.refunded) return null;
  const shared = board.payouts.some((row) => row.net > 0);
  if (!shared) {
    return {
      kind: "plain",
      title: "All wagers were returned",
      detail: refundReasonCopy(board.reason),
    };
  }
  return { kind: "shared", message: leaverShareSentence(leaverNames(bettingRound, board.payouts)) };
}

/**
 * Paid rounds show a 1-based rank. A missing rank stays blank.
 * A refund has no placement, so the cell is a dash.
 */
export function formatBetRank(rank: number | null | undefined, refunded = false): string {
  if (refunded) return "–";
  if (typeof rank !== "number" || !Number.isFinite(rank) || rank <= 0) return "";
  return String(Math.trunc(rank));
}

function leaverNames(
  bettingRound: BettingRoundEvent | null,
  payouts: BettingPayoutEvent["payouts"],
): string[] {
  if (!bettingRound) return [];
  const paidIds = new Set(payouts.map((row) => row.playerId));
  const paidNames = new Set(payouts.map((row) => row.name));
  const names: string[] = [];
  for (const wager of bettingRound.wagers) {
    if (paidIds.has(wager.playerId)) continue;
    if (wager.wager <= 0) continue;
    const name = wager.name.trim();
    if (!name || paidNames.has(name) || names.includes(name)) continue;
    names.push(name);
  }
  return names;
}

function leaverShareSentence(names: string[]): string {
  if (names.length === 0) {
    return "Wagers returned. A leaver's stake was shared among the remaining players.";
  }
  if (names.length === 1) {
    return `Wagers returned. ${names[0]}'s stake was shared among the remaining players.`;
  }
  const owned = names.map((name) => `${name}'s`);
  const listed =
    owned.length === 2
      ? `${owned[0]} and ${owned[1]}`
      : `${owned.slice(0, -1).join(", ")} and ${owned[owned.length - 1]}`;
  return `Wagers returned. ${listed} stakes were shared among the remaining players.`;
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
