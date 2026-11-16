import { createSlice } from "@reduxjs/toolkit";

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

const initialState = {
  playerName: "",
  roomId: "",
  players: [] as any[],
  selectedPlayers: [] as string[],
  gamePhase: "lobby", // lobby, chart, wheel, countdown, playing, resolution
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
} = lobbySlice.actions;
export default lobbySlice.reducer;
