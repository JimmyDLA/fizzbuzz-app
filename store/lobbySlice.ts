import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DEFAULT_TOTAL_ROUNDS,
  GameOverPayload,
  PodiumEntry,
  podiumEqual,
} from "../utils/rounds";

export interface PendingCardAward {
  cardId: string;
  reason: string;
  message: string;
}

/**
 * One player's merged drink total for this resolution.
 * Mirrors server `DrinkChain`. `LobbyState.drinkChains` is keyed by holder session id.
 */
export interface DrinkChain {
  /** Same as `holderId`. The map key on `drinkChains`. */
  id: string;
  holderId: string;
  /** Merged drinks this player currently owes for this resolution. */
  drinks: number;
  /** Deflections already included in this total. 0 means an untouched loss. */
  deflections: number;
  /**
   * Amount the holder's next Shield will pass.
   * An untouched loss passes `drinks`. Once any deflection is part of the total, the next pass is `drinks + 1`. No cap.
   */
  drinksToPass: number;
}

/**
 * `CardUsedEvent` payload. For Shield, `drinkCount` and `drinksToPass` are the amount just passed.
 */
export interface CardUsedEvent {
  userId?: string;
  playerName?: string;
  cardId?: string;
  targetName?: string;
  targetPlayerId?: string;
  drinkCount?: number;
  drinksToPass?: number;
  deflections?: number;
  description?: string;
  message?: string;
  /** Wild Card kept this betting round in Battle Royale. */
  forcedBattleRoyale?: boolean;
}

export interface CardAnnouncement {
  cardId: string;
  playerName: string;
  message: string;
  targetName?: string;
  targetPlayerId?: string;
  drinkCount?: number;
  /** Amount this Shield just passed. Equal to `drinkCount` on Shield broadcasts. */
  drinksToPass?: number;
  deflections?: number;
  timestamp?: number;
  /** Wild Card kept this betting round in Battle Royale. */
  forcedBattleRoyale?: boolean;
}

/** Player fields mirrored from the Colyseus schema, including the betting round. */
export interface LobbyPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  /** False while the seat is disconnected. Missing on an older server means connected. */
  isConnected: boolean;
  score: number;
  drinks: number;
  gameScore: number;
  gameData: string;
  cards: string[];
  activeEffects: string;
  /** Points already removed from score. 0 outside a locked betting round. */
  betWager: number;
  /** Points paid back from the pot. 0 until the round resolves. */
  betPayout: number;
  /** betPayout − betWager. Equals −betWager while the round is still in play. */
  betNet: number;
  /** 1-based rank. Ties share the best rank. 0 until the pot is paid, and 0 on a refund. */
  betRank: number;
}

export interface BettingWagerView {
  playerId: string;
  name: string;
  wager: number;
}

/** Sent once, when the betting round's wheel first starts. */
export interface BettingRoundEvent {
  roundCount: number;
  pot: number;
  mode: "BR";
  wagers: BettingWagerView[];
}

export interface BettingPayoutView {
  playerId: string;
  name: string;
  wager: number;
  payout: number;
  net: number;
  rank: number;
}

export type BettingPayoutReason = "payout" | "no-action" | "aborted" | "unresolved";

/** Sent when the pot is paid or every wager is returned. */
export interface BettingPayoutEvent {
  roundCount: number;
  pot: number;
  refunded: boolean;
  reason: BettingPayoutReason;
  payouts: BettingPayoutView[];
}

export interface BettingStateFields {
  isBettingRound: boolean;
  bettingPot: number;
  bettingRefunded: boolean;
  phase: string;
}

export interface LobbyErrorNotice {
  code: string;
  message: string;
}

/** A Wild Card or Respin is in the server's private card lock. Ready must not be sent. */
export interface WheelHold {
  cardId: string;
  startedAt: number;
}

const initialState = {
  playerName: "",
  roomId: "",
  players: [] as LobbyPlayer[],
  isBettingRound: false,
  bettingPot: 0,
  bettingRefunded: false,
  bettingRound: null as BettingRoundEvent | null,
  bettingPayout: null as BettingPayoutEvent | null,
  /** Skip the chart's +3 coin pop after a pot payout, until a normal round is in play. */
  scorePopBlocked: false,
  selectedPlayers: [] as string[],
  gamePhase: "lobby", // lobby, chart, wheel, countdown, playing, resolution, gameover
  timer: 0,
  currentGameType: "",
  currentCategory: "",
  lastWinners: [] as string[],
  lastLosers: [] as string[],
  drinkChains: {} as Record<string, DrinkChain>,
  lastGameResult: "",
  practiceState: null,
  gameMode: null, // null, 'drinking', 'party'
  ageVerified: false,
  birthYear: null,
  theme: "light" as "light" | "dark",
  isMusicOn: false,
  pendingCardAward: null as PendingCardAward | null,
  cardAnnouncement: null as CardAnnouncement | null,
  spinCount: 0,
  totalRounds: DEFAULT_TOTAL_ROUNDS as number,
  roundCount: 0,
  podium: [] as PodiumEntry[],
  /** True only after this room's state includes totalRounds. Older servers omit it. */
  matchLengthSupported: false,
  readyCount: null as number | null,
  connectedCount: null as number | null,
  lobbyError: null as LobbyErrorNotice | null,
  wheelHold: null as WheelHold | null,
};

export const lobbySlice = createSlice({
  name: "lobby",
  initialState,
  reducers: {
    setPlayerName: (state, action) => {
      state.playerName = action.payload;
    },
    setRoomId: (state, action) => {
      state.roomId = action.payload;
    },
    setPlayers: (state, action) => {
      state.players = action.payload;
    },
    setSelectedPlayers: (state, action) => {
      state.selectedPlayers = action.payload;
    },
    setGamePhase: (state, action) => {
      if (state.gamePhase === action.payload) return;
      state.gamePhase = action.payload;
    },
    /**
     * One store write for a room patch. Counts land before phase so a
     * subscriber never sees the new phase with the previous roundCount.
     */
    applyRoomProgress: (
      state,
      action: {
        payload: {
          phase: string;
          roundCount?: number;
          totalRounds?: number;
          matchLengthSupported?: boolean;
        };
      },
    ) => {
      const { phase, roundCount, totalRounds, matchLengthSupported } = action.payload;
      if (typeof totalRounds === "number" && state.totalRounds !== totalRounds) {
        state.totalRounds = totalRounds;
      }
      if (typeof roundCount === "number" && state.roundCount !== roundCount) {
        state.roundCount = roundCount;
      }
      if (matchLengthSupported && !state.matchLengthSupported) {
        state.matchLengthSupported = true;
      }
      if (state.gamePhase !== phase) {
        state.gamePhase = phase;
      }
    },
    setTimer: (state, action) => {
      state.timer = action.payload;
    },
    setGameType: (state, action) => {
      state.currentGameType = action.payload;
    },
    setGameCategory: (state, action) => {
      state.currentCategory = action.payload;
    },
    setLastWinners: (state, action) => {
      state.lastWinners = action.payload;
    },
    setLastLosers: (state, action) => {
      state.lastLosers = action.payload;
    },
    setDrinkChains: (state, action) => {
      state.drinkChains = action.payload;
    },
    setLastGameResult: (state, action) => {
      state.lastGameResult = action.payload;
    },
    setPracticeState: (state, action) => {
      state.practiceState = action.payload;
    },
    setGameMode: (state, action) => {
      state.gameMode = action.payload;
    },
    setAgeVerified: (state, action) => {
      state.ageVerified = action.payload;
    },
    setBirthYear: (state, action) => {
      state.birthYear = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleMusic: (state) => {
      state.isMusicOn = !state.isMusicOn;
    },
    setMusicEnabled: (state, action) => {
      state.isMusicOn = action.payload;
    },
    setPendingCardAward: (state, action) => {
      state.pendingCardAward = action.payload;
    },
    clearPendingCardAward: (state) => {
      state.pendingCardAward = null;
    },
    setCardAnnouncement: (state, action) => {
      state.cardAnnouncement = action.payload;
    },
    clearCardAnnouncement: (state) => {
      state.cardAnnouncement = null;
    },
    incrementSpinCount: (state) => {
      state.spinCount += 1;
    },
    setBettingState: (state, action: PayloadAction<BettingStateFields>) => {
      state.isBettingRound = action.payload.isBettingRound;
      state.bettingPot = action.payload.bettingPot;
      state.bettingRefunded = action.payload.bettingRefunded;
      if (!action.payload.isBettingRound) {
        state.bettingRound = null;
        state.bettingPayout = null;
      }
      const phase = action.payload.phase;
      if (
        !action.payload.isBettingRound &&
        (phase === "wheel" || phase === "countdown" || phase === "playing")
      ) {
        state.scorePopBlocked = false;
      }
    },
    setBettingRound: (state, action: PayloadAction<BettingRoundEvent>) => {
      state.bettingRound = action.payload;
      state.bettingPayout = null;
      state.isBettingRound = true;
      state.bettingPot = action.payload.pot;
      state.bettingRefunded = false;
    },
    setBettingPayout: (state, action: PayloadAction<BettingPayoutEvent>) => {
      state.bettingPayout = action.payload;
      state.bettingRefunded = action.payload.refunded;
      state.bettingPot = action.payload.pot;
      state.scorePopBlocked = true;
    },
    clearBetting: (state) => {
      state.isBettingRound = false;
      state.bettingPot = 0;
      state.bettingRefunded = false;
      state.bettingRound = null;
      state.bettingPayout = null;
      state.scorePopBlocked = false;
    },
    setTotalRounds: (state, action) => {
      if (state.totalRounds === action.payload) return;
      state.totalRounds = action.payload;
    },
    setRoundCount: (state, action) => {
      if (state.roundCount === action.payload) return;
      state.roundCount = action.payload;
    },
    setMatchLengthSupported: (state, action) => {
      if (state.matchLengthSupported === action.payload) return;
      state.matchLengthSupported = action.payload;
    },
    setPodium: (state, action) => {
      if (podiumEqual(state.podium, action.payload)) return;
      state.podium = action.payload;
    },
    setGameOver: (state, action: { payload: GameOverPayload }) => {
      const payload = action.payload;
      const nextCount = payload.roundCount > 0 ? payload.roundCount : state.roundCount;
      const nextTotal = payload.totalRounds > 0 ? payload.totalRounds : state.totalRounds;
      const nextPodium = payload.podium.length > 0 ? payload.podium : state.podium;
      if (
        state.gamePhase === "gameover" &&
        state.roundCount === nextCount &&
        state.totalRounds === nextTotal &&
        podiumEqual(state.podium, nextPodium)
      ) {
        return;
      }
      state.roundCount = nextCount;
      state.totalRounds = nextTotal;
      state.podium = nextPodium;
      state.gamePhase = "gameover";
    },
    setReadyCount: (state, action) => {
      state.readyCount = action.payload;
    },
    setConnectedCount: (state, action) => {
      state.connectedCount = action.payload;
    },
    setLobbyError: (state, action) => {
      state.lobbyError = action.payload;
    },
    clearLobbyError: (state) => {
      state.lobbyError = null;
    },
    setWheelHold: (state, action) => {
      state.wheelHold = action.payload;
    },
    clearWheelHold: (state) => {
      state.wheelHold = null;
    },
    resetMatch: (state) => {
      state.roomId = "";
      state.players = [];
      state.selectedPlayers = [];
      state.gamePhase = "lobby";
      state.timer = 0;
      state.currentGameType = "";
      state.currentCategory = "";
      state.lastWinners = [];
      state.lastLosers = [];
      state.drinkChains = {};
      state.lastGameResult = "";
      state.practiceState = null;
      state.pendingCardAward = null;
      state.cardAnnouncement = null;
      state.spinCount = 0;
      state.totalRounds = DEFAULT_TOTAL_ROUNDS;
      state.roundCount = 0;
      state.podium = [];
      state.matchLengthSupported = false;
      state.readyCount = null;
      state.connectedCount = null;
      state.lobbyError = null;
      state.wheelHold = null;
      state.isBettingRound = false;
      state.bettingPot = 0;
      state.bettingRefunded = false;
      state.bettingRound = null;
      state.bettingPayout = null;
      state.scorePopBlocked = false;
    },
  },
});

export const {
  setPlayerName,
  setRoomId,
  setPlayers,
  setSelectedPlayers,
  setGamePhase,
  applyRoomProgress,
  setTimer,
  setGameType,
  setGameCategory,
  setLastWinners,
  setLastLosers,
  setDrinkChains,
  setLastGameResult,
  setPracticeState,
  setGameMode,
  setAgeVerified,
  setBirthYear,
  toggleTheme,
  setTheme,
  toggleMusic,
  setMusicEnabled,
  setPendingCardAward,
  clearPendingCardAward,
  setCardAnnouncement,
  clearCardAnnouncement,
  incrementSpinCount,
  setBettingState,
  setBettingRound,
  setBettingPayout,
  clearBetting,
  setTotalRounds,
  setRoundCount,
  setMatchLengthSupported,
  setPodium,
  setGameOver,
  setReadyCount,
  setConnectedCount,
  setLobbyError,
  clearLobbyError,
  setWheelHold,
  clearWheelHold,
  resetMatch,
} = lobbySlice.actions;
export default lobbySlice.reducer;
