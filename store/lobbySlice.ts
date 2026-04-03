import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  playerName: '',
  roomId: '',
  players: [],
  selectedPlayers: [],
  gamePhase: 'lobby', // lobby, chart, wheel, countdown, playing, resolution
  timer: 0,
  currentGameType: '',
  currentCategory: '',
  lastWinners: [],
  lastLosers: [],
};

export const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    setPlayerName: (state, action) => { state.playerName = action.payload; },
    setRoomId: (state, action) => { state.roomId = action.payload; },
    setPlayers: (state, action) => { state.players = action.payload; },
    setSelectedPlayers: (state, action) => { state.selectedPlayers = action.payload; },
    setGamePhase: (state, action) => { state.gamePhase = action.payload; },
    setTimer: (state, action) => { state.timer = action.payload; },
    setGameType: (state, action) => { state.currentGameType = action.payload; },
    setGameCategory: (state, action) => { state.currentCategory = action.payload; },
    setLastWinners: (state, action) => { state.lastWinners = action.payload; },
    setLastLosers: (state, action) => { state.lastLosers = action.payload; },
  },
});

export const { 
  setPlayerName, setRoomId, setPlayers, setSelectedPlayers, 
  setGamePhase, setTimer, setGameType, setGameCategory,
  setLastWinners, setLastLosers
} = lobbySlice.actions;
export default lobbySlice.reducer;
