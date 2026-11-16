import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PendingCardAward {
  cardId: string;
  reason: string;
  message: string;
}

export interface CardAnnouncement {
  cardId: string;
  playerName: string;
  message: string;
  targetName?: string;
  drinkCount?: number;
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
  gamePhase: "lobby", // lobby, chart, wheel, countdown, playing, resolution
  timer: 0,
  currentGameType: "",
  currentCategory: "",
  lastWinners: [] as string[],
  lastLosers: [] as string[],
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
      state.gamePhase = action.payload;
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
  },
});

export const {
  setPlayerName,
  setRoomId,
  setPlayers,
  setSelectedPlayers,
  setGamePhase,
  setTimer,
  setGameType,
  setGameCategory,
  setLastWinners,
  setLastLosers,
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
} = lobbySlice.actions;
export default lobbySlice.reducer;
