/**
 * A card earned in round N can be played starting in round N+1.
 * `roundCount` advances at the start of resolution, which is also when cards
 * are dealt, so chart, wheel, countdown, playing, and lobby are still the
 * next round (`roundCount + 1`). During resolution the round in progress is
 * `roundCount` itself.
 *
 * A missing `earnedRounds` entry is usable. The server field ships in an
 * unmerged PR, so an older room simply has no lock.
 */

export const USABLE_NEXT_ROUND_HINT = "Usable next round";

export const EARNED_THIS_ROUND_MESSAGE =
  "This card can't be used until next round.";

export function currentRound(
  phase: string | undefined,
  roundCount: unknown,
): number {
  const count =
    typeof roundCount === "number" && Number.isFinite(roundCount)
      ? roundCount
      : 0;
  if (phase === "resolution") return count;
  return count + 1;
}

function toList(value: unknown): unknown[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") {
    const schema = value as { toArray?: () => unknown[]; length?: number };
    if (typeof schema.toArray === "function") {
      try {
        const listed = schema.toArray();
        return Array.isArray(listed) ? listed : [];
      } catch {
        return [];
      }
    }
    if (typeof schema.length === "number") {
      try {
        return Array.from(value as ArrayLike<unknown>);
      } catch {
        return [];
      }
    }
  }
  return [];
}

/** Parallel to `cards`. `null` means the entry was missing or not a number. */
export function readEarnedRounds(value: unknown): (number | null)[] {
  return toList(value).map((entry) => {
    if (typeof entry === "number") {
      return Number.isFinite(entry) ? entry : null;
    }
    if (typeof entry === "string" && entry.trim() !== "") {
      const parsed = Number(entry);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  });
}

export function isCardLockedThisRound(
  earnedRounds: (number | null)[] | null | undefined,
  index: number,
  phase: string | undefined,
  roundCount: unknown,
): boolean {
  if (!earnedRounds || index < 0 || index >= earnedRounds.length) return false;
  const earned = earnedRounds[index];
  if (typeof earned !== "number") return false;
  return earned >= currentRound(phase, roundCount);
}

export function normalizeCardId(cardId: string): string {
  return cardId.toLowerCase().replace(/\s+/g, "_");
}

/** True when the hand holds a copy of `cardId` that can be played this round. */
export function hasUsableCopy(
  cards: string[] | null | undefined,
  earnedRounds: (number | null)[] | null | undefined,
  cardId: string,
  phase: string | undefined,
  roundCount: unknown,
): boolean {
  const target = normalizeCardId(cardId);
  return (cards ?? []).some(
    (id, index) =>
      normalizeCardId(id) === target &&
      !isCardLockedThisRound(earnedRounds, index, phase, roundCount),
  );
}
