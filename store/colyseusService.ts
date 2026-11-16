import type { Room } from '@colyseus/sdk';
import * as Colyseus from '@colyseus/sdk';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import { setGameCategory, setGamePhase, setGameType, setLastLosers, setLastWinners, setPlayers, setRoomId, setSelectedPlayers, setTimer, setLastGameResult, setPracticeState, setPendingCardAward, setCardAnnouncement, incrementSpinCount, setTotalRounds, setRoundCount, setPodium, setGameOver, resetMatch } from './lobbySlice';
import { store } from './store';
import { DEFAULT_TOTAL_ROUNDS, GameOverPayload, isRoundsErrorCode, mergeGameOver, normalizePodium, roundsErrorMessage } from '../utils/rounds';



const getHostIp = () => {
  const manifestHost = Constants.expoConfig?.hostUri?.split(':')[0];
  const experienceHost = Constants.experienceUrl?.split('//')[1]?.split(':')[0];
  const debuggerHost = (Constants as any).debuggerHost?.split(':')[0];
  const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  return manifestHost || experienceHost || debuggerHost || fallbackHost;
};

const hostIp = getHostIp();
const ENDPOINT = `ws://${hostIp}:2567`;

console.log(`[Colyseus] Connecting to endpoint: ${ENDPOINT}`);
console.log(`[Colyseus] Detection Info: manifest=${Constants.expoConfig?.hostUri}, experience=${Constants.experienceUrl}, debugger=${(Constants as any).debuggerHost}`);

const client = new Colyseus.Client(ENDPOINT);
let currentRoom: Room | null = null;
let practiceRoom: Room | null = null;
/**
 * Set when GameOverEvent (or a gameover state patch) is captured.
 * The server closes the socket immediately after that broadcast. The close
 * must keep the podium on screen and must not start a reconnect.
 */
let gameOverActive = false;
let gameOverPayload: GameOverPayload | null = null;

function clearGameOverHandoff() {
  gameOverActive = false;
  gameOverPayload = null;
}

function holdGameOver(room: { reconnection?: { enabled: boolean } } | null, payload: GameOverPayload) {
  const first = !gameOverActive;
  gameOverActive = true;
  gameOverPayload = mergeGameOver(gameOverPayload, payload);
  if (room?.reconnection) {
    room.reconnection.enabled = false;
  }
  store.dispatch(setGameOver(gameOverPayload));
  if (first) {
    import('expo-router').then(({ router }) => {
      router.replace('/podium');
    });
  }
}

function readGameOver(state: any): GameOverPayload {
  return {
    roundCount: Number(state?.roundCount) || 0,
    totalRounds: Number(state?.totalRounds) || DEFAULT_TOTAL_ROUNDS,
    podium: normalizePodium(state?.podium),
  };
}

export const colyseusService = {
  get room() {
    return currentRoom;
  },
  get practiceRoom() {
    return practiceRoom;
  },

  async connectAsHost(playerName: string) {
    try {
      clearGameOverHandoff();
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
      clearGameOverHandoff();
      currentRoom = await client.joinById(roomId, { name: playerName });
      this.setupRoomListeners(currentRoom);
      return currentRoom?.roomId;
    } catch (e: any) {
      console.error("Join Error:", e?.message || e?.name || e);
      throw e;
    }
  },

  disconnect() {
    clearGameOverHandoff();
    if (currentRoom) {
      currentRoom.reconnection.enabled = false;
      currentRoom.leave();
      currentRoom = null;
    }
    store.dispatch(resetMatch());
  },

  /**
   * The podium stays up after the server frees the room. Home clears that
   * snapshot and returns the player to the start screen.
   */
  leaveAfterGameOver() {
    clearGameOverHandoff();
    const room = currentRoom;
    currentRoom = null;
    if (room) {
      room.reconnection.enabled = false;
      try {
        room.leave(true);
      } catch (error) {
        console.log("[Colyseus] Leave after game over:", error);
      }
    }
    store.dispatch(resetMatch());
  },

  sendSetRounds(rounds: number) {
    if (currentRoom) {
      currentRoom.send("set_rounds", { rounds });
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

  sendDevAwardCard(targetPlayerId: string, cardId: string) {
    if (currentRoom) {
      currentRoom.send("dev_award_card", { targetPlayerId, cardId });
    }
  },

  setupRoomListeners(room: any) {
    store.dispatch(setRoomId(room.id || room.roomId));

    room.onMessage("CardUsedEvent", (event: any) => {
      console.log(`[SpecialtyCard] CardUsedEvent:`, event);
      if (event.cardId === "RESPIN" || event.cardId === "WILD CARD") {
        this.leavePractice();
      }
      store.dispatch(setCardAnnouncement({
        cardId: event.cardId,
        playerName: event.playerName,
        message: event.message || event.description,
        targetName: event.targetName,
        drinkCount: event.drinkCount,
        timestamp: Date.now(),
      }));
    });

    room.onMessage("CardAwardedEvent", (event: any) => {
      console.log(`[SpecialtyCard] CardAwardedEvent:`, event);
      store.dispatch(setPendingCardAward({
        cardId: event.cardId,
        reason: event.reason,
        message: event.message,
      }));
    });

    room.onMessage("GameOverEvent", (event: any) => {
      console.log(`[Colyseus] GameOverEvent:`, event);
      holdGameOver(room, {
        roundCount: Number(event?.roundCount) || 0,
        totalRounds: Number(event?.totalRounds) || DEFAULT_TOTAL_ROUNDS,
        podium: normalizePodium(event?.podium),
      });
    });

    room.onMessage("LobbyError", (event: any) => {
      if (!isRoundsErrorCode(event?.code)) return;
      Alert.alert("Match length", roundsErrorMessage(event.code, event?.message));
    });

    room.onMessage("SpinWheelEvent", (event: any) => {
      console.log(`[SpecialtyCard] SpinWheelEvent:`, event);
      this.leavePractice();
      if (event.type) store.dispatch(setGameType(event.type));
      if (event.category) store.dispatch(setGameCategory(event.category));
      if (event.selectedPlayers) store.dispatch(setSelectedPlayers(event.selectedPlayers));
      store.dispatch(incrementSpinCount());
    });

    room.state.players?.onAdd?.((player: any, sessionId: string) => {
      player.onChange(() => {
        this.syncPlayersState(room);
      });
    });

    room.onStateChange((state: any) => {
      if (state?.phase === "gameover") {
        holdGameOver(room, readGameOver(state));
      }

      import('react-redux').then(({ batch }) => {
        // A patch can resolve after the socket is already gone. Don't put a
        // finished match back on screen, and don't resurrect a room we left.
        if (currentRoom !== room && !gameOverActive) return;
        batch(() => {
          if (currentRoom !== room && !gameOverActive) return;
          const phase = gameOverActive ? "gameover" : state.phase;
          store.dispatch(setGamePhase(phase));
          store.dispatch(setTimer(state.timer));
          store.dispatch(setGameType(state.currentGameType));
          store.dispatch(setGameCategory(state.currentCategory));
          if (typeof state.totalRounds === "number") {
            store.dispatch(setTotalRounds(state.totalRounds));
          }
          if (typeof state.roundCount === "number") {
            store.dispatch(setRoundCount(state.roundCount));
          }
          const podium = normalizePodium(state.podium);
          if (!(gameOverActive && podium.length === 0)) {
            store.dispatch(setPodium(podium));
          }

          if (state.selectedPlayers) {
            store.dispatch(setSelectedPlayers(state.selectedPlayers.toArray()));
          }
          if (state.lastWinners) {
            store.dispatch(setLastWinners(state.lastWinners.toArray()));
          }
          if (state.lastLosers) {
            store.dispatch(setLastLosers(state.lastLosers.toArray()));
          }
          if (state.lastGameResult !== undefined) {
            store.dispatch(setLastGameResult(state.lastGameResult));
          }

          this.syncPlayersState(room);
        });
      });
    });

    room.onError((code: number, message?: string) => {
      if (gameOverActive) {
        console.log(`[Colyseus] Game over socket closed (${code})`);
        return;
      }
      console.log(`[Colyseus] Error ${code}: ${message || ""}`);
    });

    room.onLeave((code: number) => {
      console.log(`[Colyseus] Disconnected with code: ${code}`);
      currentRoom = null;
      if (gameOverActive) {
        if (gameOverPayload) {
          store.dispatch(setGameOver(gameOverPayload));
        } else {
          store.dispatch(setGamePhase("gameover"));
        }
        import('expo-router').then(({ router }) => {
          router.replace('/podium');
        });
        return;
      }

      store.dispatch(resetMatch());

      // Imperative routing to home screen when connection dies
      import('expo-router').then(({ router }) => {
        if (router.canGoBack() || true) {
          router.replace('/');
        }
      });
    });
  },

  useCard(cardId: string, payload?: any) {
    if (currentRoom) {
      currentRoom.send("use_card", { cardId, ...payload });
    }
  },

  discardCard(cardIndexOrId: number | string) {
    if (currentRoom) {
      if (typeof cardIndexOrId === "number") {
        currentRoom.send("discard_card", { cardIndex: cardIndexOrId });
      } else {
        currentRoom.send("discard_card", { cardId: cardIndexOrId });
      }
    }
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
        cards: player.cards
          ? player.cards.toArray
            ? player.cards.toArray()
            : Array.from(player.cards)
          : [],
        activeEffects: player.activeEffects || "",
      });
    });
    store.dispatch(setPlayers(playersArray));
  },

  async joinPractice(category: string, playerName: string) {
    try {
      practiceRoom = await client.create("practice_room", { category, name: playerName });
      this.setupPracticeRoomListeners(practiceRoom);
      return practiceRoom?.roomId;
    } catch (e: any) {
      console.error("Practice Join Error:", e?.message || e?.name || e);
      throw e;
    }
  },

  leavePractice() {
    if (practiceRoom) {
      practiceRoom.leave();
      practiceRoom = null;
      store.dispatch(setPracticeState(null));
    }
  },

  sendPracticeGameAction(message: any) {
    if (practiceRoom) {
      practiceRoom.send("action", message);
    }
  },

  setupPracticeRoomListeners(room: any) {
    const updatePracticeState = (state: any) => {
      const playersArray: any[] = [];
      state.players?.forEach((player: any) => {
        playersArray.push({
          id: player.id,
          name: player.name,
          gameScore: player.gameScore || 0,
          gameData: player.gameData || "",
        });
      });
      
      store.dispatch(setPracticeState({
        phase: state.phase,
        timer: state.timer,
        players: playersArray,
      }));
    };

    room.state.players?.onAdd?.((player: any) => {
      player.onChange(() => updatePracticeState(room.state));
    });

    room.onStateChange((state: any) => {
      updatePracticeState(state);
    });

    room.onLeave(() => {
      practiceRoom = null;
      store.dispatch(setPracticeState(null));
    });
  }
};
