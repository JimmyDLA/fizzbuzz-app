import { createSlice } from "@reduxjs/toolkit";
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
  /** Round stamped on the award. Absent on older servers. */
  earnedRound?: number;
}

export interface CardErrorNotice {
  cardId: string;
  code: string;
  message: string;
  earnedRound?: number;
  id: number;
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
  players: [] as any[],
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
  cardError: null as CardErrorNotice | null,
  spinCount: 0,
  totalRounds: DEFAULT_TOTAL_ROUNDS as number,
  /** LobbyState.roundCount. 0 until the server sends it. */
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
    setCardError: (
      state,
      action: { payload: Omit<CardErrorNotice, "id"> },
    ) => {
      state.cardError = {
        ...action.payload,
        id: (state.cardError?.id ?? 0) + 1,
      };
    },
    clearCardError: (state) => {
      state.cardError = null;
    },
    incrementSpinCount: (state) => {
      state.spinCount += 1;
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
      state.cardError = null;
      state.spinCount = 0;
      state.totalRounds = DEFAULT_TOTAL_ROUNDS;
      state.roundCount = 0;
      state.podium = [];
      state.matchLengthSupported = false;
      state.readyCount = null;
      state.connectedCount = null;
      state.lobbyError = null;
      state.wheelHold = null;
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
  setCardError,
  clearCardError,
  incrementSpinCount,
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
