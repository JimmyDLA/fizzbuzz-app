export const ROUND_CHOICES = [10, 15, 20, 30, 40, 50] as const;

export type RoundChoice = (typeof ROUND_CHOICES)[number];

export const DEFAULT_TOTAL_ROUNDS: RoundChoice = 10;

export const ROUNDS_ERROR_CODES = ["NOT_HOST", "ROUNDS_LOCKED", "INVALID_ROUNDS"] as const;

export type RoundsErrorCode = (typeof ROUNDS_ERROR_CODES)[number];

export interface PodiumEntry {
  place: number;
  playerId: string;
  name: string;
  score: number;
}

export interface GameOverPayload {
  roundCount: number;
  totalRounds: number;
  podium: PodiumEntry[];
}

const ROUNDS_ERROR_FALLBACK: Record<RoundsErrorCode, string> = {
  NOT_HOST: "Only the host can set the match length.",
  ROUNDS_LOCKED: "Match length can only be changed in the lobby.",
  INVALID_ROUNDS: "Rounds must be 10, 15, 20, 30, 40, or 50.",
};

export function isRoundChoice(value: unknown): value is RoundChoice {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    (ROUND_CHOICES as readonly number[]).includes(value)
  );
}

export function coerceRoundChoice(value: number): RoundChoice {
  return isRoundChoice(value) ? value : DEFAULT_TOTAL_ROUNDS;
}

export function isRoundsErrorCode(value: unknown): value is RoundsErrorCode {
  return (
    typeof value === "string" &&
    (ROUNDS_ERROR_CODES as readonly string[]).includes(value)
  );
}

export function roundsErrorMessage(code: RoundsErrorCode, message?: string): string {
  const trimmed = message?.trim();
  return trimmed ? trimmed : ROUNDS_ERROR_FALLBACK[code];
}

const UPCOMING_PHASES = new Set(["chart", "wheel", "countdown", "playing"]);

/**
 * Round X, or Round X/N when the server sent a match length.
 * `roundCount` is how many resolutions have started. It stays 0 in the lobby,
 * and it does not move for a respin, wild card, abort, or the ready-out back
 * to the chart. The label uses that count during resolution and gameover, and
 * the next number (`roundCount + 1`) while the round is still being played.
 * The lobby stays hidden. A null total means the server has no totalRounds,
 * so the label is "Round X" with no "/N".
 */
export function visibleRoundNumber(phase: string, roundCount: number): number | null {
  if (!Number.isFinite(roundCount) || roundCount < 0) return null;
  if (phase === "resolution" || phase === "gameover") {
    return roundCount > 0 ? roundCount : null;
  }
  if (UPCOMING_PHASES.has(phase)) {
    return roundCount + 1;
  }
  return null;
}

export function roundLabel(
  phase: string,
  roundCount: number,
  totalRounds: number | null,
): string | null {
  const shown = visibleRoundNumber(phase, roundCount);
  if (shown == null) return null;
  if (totalRounds == null || !Number.isFinite(totalRounds) || totalRounds <= 0) {
    return `Round ${shown}`;
  }
  return `Round ${shown}/${totalRounds}`;
}

export function podiumEqual(
  left: readonly PodiumEntry[],
  right: readonly PodiumEntry[],
): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (
      a.place !== b.place ||
      a.playerId !== b.playerId ||
      a.name !== b.name ||
      a.score !== b.score
    ) {
      return false;
    }
  }
  return true;
}

function readList(value: unknown): unknown[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toArray" in value &&
    typeof (value as { toArray?: unknown }).toArray === "function"
  ) {
    return (value as { toArray: () => unknown[] }).toArray();
  }
  return [];
}

export function normalizePodium(raw: unknown): PodiumEntry[] {
  return readList(raw).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    const place = Number(entry.place);
    const playerId = typeof entry.playerId === "string" ? entry.playerId : "";
    const name = typeof entry.name === "string" ? entry.name : "";
    const score = Number(entry.score);
    if (![1, 2, 3].includes(place) || !playerId) return [];
    return [
      {
        place,
        playerId,
        name,
        score: Number.isFinite(score) ? score : 0,
      },
    ];
  });
}

export function mergeGameOver(
  previous: GameOverPayload | null,
  next: GameOverPayload,
): GameOverPayload {
  if (!previous) return next;
  return {
    roundCount: next.roundCount > 0 ? next.roundCount : previous.roundCount,
    totalRounds: next.totalRounds > 0 ? next.totalRounds : previous.totalRounds,
    podium: next.podium.length > 0 ? next.podium : previous.podium,
  };
}

export interface PodiumColumn {
  place: number;
  players: PodiumEntry[];
}

/**
 * Visual order is 2nd, 1st, 3rd so the winner sits in the middle.
 * A skipped place (a tie) is omitted, and a short match omits places that
 * nobody earned.
 */
export function podiumColumns(entries: readonly PodiumEntry[]): PodiumColumn[] {
  const byPlace = new Map<number, PodiumEntry[]>();
  for (const entry of entries) {
    const seated = byPlace.get(entry.place) ?? [];
    seated.push(entry);
    byPlace.set(entry.place, seated);
  }
  return [2, 1, 3]
    .filter((place) => (byPlace.get(place)?.length ?? 0) > 0)
    .map((place) => ({ place, players: byPlace.get(place) ?? [] }));
}

export function placeTitle(place: number): string {
  if (place === 1) return "1ST";
  if (place === 2) return "2ND";
  if (place === 3) return "3RD";
  return `${place}`;
}
