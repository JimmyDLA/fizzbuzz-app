import {
  displayedGameType,
  roundIsBetting,
  type GameTypeSource,
} from "../utils/betting";
import type { RootState } from "./store";

function gameTypeSource(state: RootState): GameTypeSource {
  const lobby = state.lobby;
  return {
    phase: lobby.gamePhase,
    roundCount: lobby.roundCount,
    currentGameType: lobby.currentGameType,
    isBettingRound: lobby.isBettingRound,
    bettingRound: lobby.bettingRound,
  };
}

/**
 * Mode label for the round on screen.
 * Betting rounds read "BATTLE ROYALE" even when `currentGameType` is still
 * the previous round's "1v1" or "2v2".
 */
export function selectDisplayedGameType(state: RootState): string {
  return displayedGameType(gameTypeSource(state));
}

/** True when that same round is a betting round. */
export function selectRoundIsBetting(state: RootState): boolean {
  return roundIsBetting(gameTypeSource(state));
}
