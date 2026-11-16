import type { DrinkChain } from "../store/lobbySlice";

/**
 * Drinks the next Shield passes for a merged total.
 * An untouched loss sends the drinks they currently hold.
 * Once a deflection is part of that total, the next pass sends those drinks plus 1. No cap.
 * Same rule as the server `shieldDrinksToPass`.
 */
export function shieldDrinksToPass(drinks: number, deflections: number): number {
  return deflections <= 0 ? drinks : drinks + 1;
}

type ChainLike = {
  id?: unknown;
  holderId?: unknown;
  drinks?: unknown;
  deflections?: unknown;
  drinksToPass?: unknown;
};

function readCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toDrinkChain(key: string, chain: ChainLike): DrinkChain | undefined {
  const holderId = String(chain.holderId || key || "");
  if (!holderId) return undefined;

  const drinks = readCount(chain.drinks) ?? 0;
  const deflections = readCount(chain.deflections) ?? 0;
  const reported = readCount(chain.drinksToPass);
  const drinksToPass =
    reported !== undefined && reported > 0
      ? reported
      : shieldDrinksToPass(drinks, deflections);

  return {
    id: String(chain.id || holderId),
    holderId,
    drinks,
    deflections,
    drinksToPass,
  };
}

function isMapLike(
  value: object,
): value is { forEach: (callback: (item: unknown, key: unknown) => void) => void } {
  return (
    "get" in value &&
    "forEach" in value &&
    typeof (value as { forEach?: unknown }).forEach === "function"
  );
}

/** Read `LobbyState.drinkChains` from a Colyseus MapSchema or a plain object. */
export function readDrinkChains(raw: unknown): Record<string, DrinkChain> {
  const chains: Record<string, DrinkChain> = {};
  if (!raw || typeof raw !== "object") return chains;

  const add = (key: unknown, value: unknown) => {
    if (!value || typeof value !== "object") return;
    const chain = toDrinkChain(String(key ?? ""), value as ChainLike);
    if (!chain) return;
    chains[chain.holderId] = chain;
  };

  if (isMapLike(raw)) {
    raw.forEach((value, key) => add(key, value));
    return chains;
  }

  for (const [key, value] of Object.entries(raw)) {
    add(key, value);
  }
  return chains;
}

/**
 * Amount this holder's next Shield sends.
 * Uses `drinkChains[playerId].drinksToPass` when the server has published a chain.
 * Otherwise falls back to how many times they appear in `lastLosers` (the owed total).
 */
export function holderDrinksToPass(
  playerId: string | undefined,
  drinkChains: Record<string, DrinkChain> | undefined,
  lastLosers: readonly string[] | undefined,
): number {
  if (!playerId) return 0;
  const chain = drinkChains?.[playerId];
  if (chain && chain.drinksToPass > 0) return chain.drinksToPass;
  return (lastLosers ?? []).filter((id) => id === playerId).length;
}

/** "DRINK" for a single drink, otherwise "3X DRINKS". */
export function passDrinkPhrase(count: number): string {
  return count > 1 ? `${count}X DRINKS` : "DRINK";
}
