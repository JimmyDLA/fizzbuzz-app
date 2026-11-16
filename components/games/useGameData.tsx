import React, { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { colyseusService } from '../../store/colyseusService';

const GameContext = createContext(false); // isPractice boolean

export const GameProvider = ({ isPractice, children }: any) => (
  <GameContext.Provider value={isPractice}>{children}</GameContext.Provider>
);

export const useGameData = () => {
  const isPractice = useContext(GameContext);
  const { playerName, ...lobbyState } = useSelector((state: any) => state.lobby);
  const practiceState = lobbyState.practiceState;

  const activeState = (isPractice && practiceState) ? practiceState : lobbyState;
  
  let players = activeState.players || [];
  let selectedPlayers = activeState.selectedPlayers || [];

  // In practice mode, everyone present is selected
  if (isPractice && practiceState) {
    selectedPlayers = players.map((p: any) => p.id);
  }

  const myPlayer = players.find((p: any) => p.name === playerName) || players[0]; // fallback for practice if name mismatch

  const sendAction = (msg: any) => {
    if (isPractice) {
      colyseusService.sendPracticeGameAction(msg);
    } else {
      colyseusService.sendGameAction(msg);
    }
  };

  return {
    players,
    playerName,
    myPlayer,
    selectedPlayers,
    timer: activeState.timer || 0,
    sendAction,
    isPractice
  };
};
