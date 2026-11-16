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
}

export interface CardAnnouncement {
  cardId: string;
  playerName: string;
  message: string;
  targetName?: string;
  drinkCount?: number;
  timestamp?: number;
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
    setTotalRounds: (state, action) => {
      if (state.totalRounds === action.payload) return;
      state.totalRounds = action.payload;
    },
    setRoundCount: (state, action) => {
      if (state.roundCount === action.payload) return;
      state.roundCount = action.payload;
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
      state.gamePhase = "gameover";
      state.roundCount = nextCount;
      state.totalRounds = nextTotal;
      state.podium = nextPodium;
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
      state.lastGameResult = "";
      state.practiceState = null;
      state.pendingCardAward = null;
      state.cardAnnouncement = null;
      state.spinCount = 0;
      state.totalRounds = DEFAULT_TOTAL_ROUNDS;
      state.roundCount = 0;
      state.podium = [];
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
  setTotalRounds,
  setRoundCount,
  setPodium,
  setGameOver,
  resetMatch,
} = lobbySlice.actions;
export default lobbySlice.reducer;
