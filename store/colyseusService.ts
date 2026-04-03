import { Platform } from 'react-native';
import { setGameCategory, setGamePhase, setGameType, setPlayers, setRoomId, setTimer, setSelectedPlayers, setLastWinners, setLastLosers } from './lobbySlice';
import { store } from './store';
import type { Room } from '@colyseus/sdk';

import Constants from 'expo-constants';

const Colyseus = require('@colyseus/sdk');

const manifestHost = Constants.expoConfig?.hostUri?.split(':')[0];
const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const hostIp = manifestHost || fallbackHost;
const ENDPOINT = `ws://${hostIp}:2567`;

const client = new Colyseus.Client(ENDPOINT);
let currentRoom: Room | null = null;

export const colyseusService = {
  async connectAsHost(playerName: string) {
    try {
      currentRoom = await client.create("lobby", { name: playerName });
      this.setupRoomListeners(currentRoom);
      return currentRoom?.roomId;
    } catch (e: any) {
      console.error("Host Error:", e?.message || e?.name || e);
      throw e;
    }
  },

  async connectAsJoin(roomId: string, playerName: string) {
    try {
      currentRoom = await client.joinById(roomId, { name: playerName });
      this.setupRoomListeners(currentRoom);
      return currentRoom?.roomId;
    } catch (e: any) {
      console.error("Join Error:", e?.message || e?.name || e);
      throw e;
    }
  },

  disconnect() {
    if (currentRoom) {
      currentRoom.leave();
      currentRoom = null;
      store.dispatch(setGamePhase('lobby'));
      store.dispatch(setPlayers([]));
      store.dispatch(setSelectedPlayers([]));
      store.dispatch(setRoomId(''));
    }
  },

  sendReady(isReady: boolean) {
    if (currentRoom) {
      currentRoom.send("ready", { isReady });
    }
  },

  sendGameAction(message: any) {
    if (currentRoom) {
      currentRoom.send("game_action", message);
    }
  },

  startWheel() {
    if (currentRoom) {
      currentRoom.send("start_wheel");
    }
  },

  sendDevStart(type: string, category: string, players: string[]) {
    if (currentRoom) {
      currentRoom.send("dev_start_wheel", { type, category, selectedPlayers: players });
    }
  },

  setupRoomListeners(room: any) {
    store.dispatch(setRoomId(room.id || room.roomId));

    room.state.players?.onAdd?.((player: any, sessionId: string) => {
      player.onChange(() => {
        this.syncPlayersState(room);
      });
    });

    room.onStateChange((state: any) => {
      import('react-redux').then(({ batch }) => {
        batch(() => {
          store.dispatch(setGamePhase(state.phase));
          store.dispatch(setTimer(state.timer));
          store.dispatch(setGameType(state.currentGameType));
          store.dispatch(setGameCategory(state.currentCategory));
          
          if (state.selectedPlayers) {
            store.dispatch(setSelectedPlayers(state.selectedPlayers.toArray()));
          }
          if (state.lastWinners) {
            store.dispatch(setLastWinners(state.lastWinners.toArray()));
          }
          if (state.lastLosers) {
            store.dispatch(setLastLosers(state.lastLosers.toArray()));
          }
          
          this.syncPlayersState(room);
        });
      });
    });
  },

  syncPlayersState(room: any) {
    const playersArray: any[] = [];
    room.state?.players?.forEach((player: any, key: string) => {
      if (!player) return;
      playersArray.push({
        id: player.id,
        name: player.name,
        isReady: !!player.isReady,
        isHost: !!player.isHost,
        score: player.score || 0,
        drinks: player.drinks || 0,
        gameScore: player.gameScore || 0,
        gameData: player.gameData || "",
      });
    });
    store.dispatch(setPlayers(playersArray));
  },
};
