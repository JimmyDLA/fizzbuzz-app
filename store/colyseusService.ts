import type { Room } from '@colyseus/sdk';
import * as Colyseus from '@colyseus/sdk';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { setGameCategory, setGamePhase, setGameType, setLastLosers, setLastWinners, setPlayers, setRoomId, setSelectedPlayers, setTimer, setLastGameResult, setPracticeState, setPendingCardAward, setCardAnnouncement, setCardError, incrementSpinCount, setPodium, setGameOver, resetMatch, applyRoomProgress, setMatchLengthSupported, setDrinkChains, setReadyCount, setConnectedCount, setLobbyError, clearLobbyError, setWheelHold, clearWheelHold, setBettingState, setBettingRound, setBettingPayout } from './lobbySlice';
import type { BettingPayoutEvent, BettingPayoutReason, BettingRoundEvent, CardUsedEvent, LobbyPlayer } from './lobbySlice';
import { store } from './store';
import { EARNED_THIS_ROUND_MESSAGE, readEarnedRounds } from '../utils/cardRound';
import { DEFAULT_TOTAL_ROUNDS, GameOverPayload, isRoundsErrorCode, mergeGameOver, normalizePodium, roundsErrorMessage } from '../utils/rounds';
import { readDrinkChains } from '../utils/shieldPass';



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

const BETTING_PAYOUT_REASONS: BettingPayoutReason[] = ["payout", "no-action", "aborted", "unresolved"];

const readNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readBettingRound = (event: any): BettingRoundEvent => {
  const wagers = Array.isArray(event?.wagers) ? event.wagers : [];
  return {
    roundCount: readNumber(event?.roundCount),
    pot: readNumber(event?.pot),
    mode: "BR",
    wagers: wagers.map((row: any) => ({
      playerId: String(row?.playerId ?? ""),
      name: String(row?.name ?? ""),
      wager: readNumber(row?.wager),
    })),
  };
};

const readBettingPayout = (event: any): BettingPayoutEvent => {
  const payouts = Array.isArray(event?.payouts) ? event.payouts : [];
  const reason = BETTING_PAYOUT_REASONS.includes(event?.reason) ? event.reason : "payout";
  return {
    roundCount: readNumber(event?.roundCount),
    pot: readNumber(event?.pot),
    refunded: event?.refunded === true,
    reason,
    payouts: payouts.map((row: any) => ({
      playerId: String(row?.playerId ?? ""),
      name: String(row?.name ?? ""),
      wager: readNumber(row?.wager),
      payout: readNumber(row?.payout),
      net: readNumber(row?.net),
      rank: readNumber(row?.rank),
    })),
  };
};

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
let podiumRouted = false;
/** Colyseus 0.17 drops the socket if the client sends a message the room did not register. */
let matchLengthSupported = false;
let wheelHoldTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Wild Card and Respin lock the wheel for 3s, then clear every isReady as the
 * spin lands. If that spin is refused, the private lock lifts 3s later and no
 * SpinWheelEvent is sent. Hold Ready until the spin event, or this fallback.
 */
const WHEEL_HOLD_FALLBACK_MS = 6500;

function beginWheelHold(cardId: string) {
  if (wheelHoldTimer) clearTimeout(wheelHoldTimer);
  store.dispatch(setWheelHold({ cardId, startedAt: Date.now() }));
  wheelHoldTimer = setTimeout(() => {
    wheelHoldTimer = null;
    store.dispatch(clearWheelHold());
  }, WHEEL_HOLD_FALLBACK_MS);
}

function endWheelHold() {
  if (wheelHoldTimer) {
    clearTimeout(wheelHoldTimer);
    wheelHoldTimer = null;
  }
  if (store.getState().lobby.wheelHold) {
    store.dispatch(clearWheelHold());
  }
}

function clearGameOverHandoff() {
  gameOverActive = false;
  gameOverPayload = null;
  podiumRouted = false;
  matchLengthSupported = false;
  store.dispatch(setMatchLengthSupported(false));
}

function holdGameOver(room: { reconnection?: { enabled: boolean } } | null, payload: GameOverPayload) {
  gameOverActive = true;
  gameOverPayload = mergeGameOver(gameOverPayload, payload);
  if (room?.reconnection) {
    room.reconnection.enabled = false;
  }
  store.dispatch(setGameOver(gameOverPayload));
  openPodium();
}

function openPodium() {
  if (podiumRouted) return;
  podiumRouted = true;
  import('expo-router').then(({ router }) => {
    router.replace('/podium');
  });
}

function readProgress(state: any) {
  const hasLength = typeof state?.totalRounds === "number";
  return {
    phase: typeof state?.phase === "string" ? state.phase : store.getState().lobby.gamePhase,
    roundCount: typeof state?.roundCount === "number" ? state.roundCount : undefined,
    totalRounds: hasLength ? state.totalRounds : undefined,
    matchLengthSupported: hasLength,
  };
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
    endWheelHold();
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
    endWheelHold();
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
    if (!matchLengthSupported || !currentRoom) return;
    currentRoom.send("set_rounds", { rounds });
  },

  sendReady(isReady: boolean) {
    if (store.getState().lobby.wheelHold) return;
    if (currentRoom) {
      currentRoom.send("ready", { isReady });
    }
  },

  sendGameAction(message: any) {
    if (currentRoom) {
      currentRoom.send("game_action", message);
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

    room.onMessage("CardUsedEvent", (event: CardUsedEvent) => {
      console.log(`[SpecialtyCard] CardUsedEvent:`, event);
      if (event.cardId === "RESPIN" || event.cardId === "WILD CARD") {
        this.leavePractice();
        beginWheelHold(event.cardId);
      }
      store.dispatch(setCardAnnouncement({
        cardId: event.cardId ?? "",
        playerName: event.playerName ?? "",
        message: event.message || event.description || "",
        targetName: event.targetName,
        targetPlayerId: event.targetPlayerId,
        drinkCount: event.drinkCount,
        drinksToPass: event.drinksToPass,
        deflections: event.deflections,
        timestamp: Date.now(),
        forcedBattleRoyale: event.forcedBattleRoyale === true,
      }));
    });

    room.onMessage("BettingRoundEvent", (event: any) => {
      console.log(`[Betting] BettingRoundEvent:`, event);
      store.dispatch(setBettingRound(readBettingRound(event)));
    });

    room.onMessage("BettingPayoutEvent", (event: any) => {
      console.log(`[Betting] BettingPayoutEvent:`, event);
      store.dispatch(setBettingPayout(readBettingPayout(event)));
    });

    room.onMessage("CardAwardedEvent", (event: any) => {
      console.log(`[SpecialtyCard] CardAwardedEvent:`, event);
      const earnedRound =
        typeof event.earnedRound === "number" && Number.isFinite(event.earnedRound)
          ? event.earnedRound
          : undefined;
      store.dispatch(setPendingCardAward({
        cardId: event.cardId,
        reason: event.reason,
        message: event.message,
        earnedRound,
      }));
    });

    room.onMessage("CardErrorEvent", (event: any) => {
      console.log(`[SpecialtyCard] CardErrorEvent:`, event);
      if (!event || event.code !== "earned_this_round") return;
      const message =
        typeof event.message === "string" && event.message.trim()
          ? event.message
          : EARNED_THIS_ROUND_MESSAGE;
      store.dispatch(setCardError({
        cardId: typeof event.cardId === "string" ? event.cardId : "",
        code: "earned_this_round",
        message,
        earnedRound:
          typeof event.earnedRound === "number" && Number.isFinite(event.earnedRound)
            ? event.earnedRound
            : undefined,
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

    room.onMessage("SpinWheelEvent", (event: any) => {
      console.log(`[SpecialtyCard] SpinWheelEvent:`, event);
      this.leavePractice();
      if (event.type) store.dispatch(setGameType(event.type));
      if (event.category) store.dispatch(setGameCategory(event.category));
      if (event.selectedPlayers) store.dispatch(setSelectedPlayers(event.selectedPlayers));
      store.dispatch(incrementSpinCount());
      endWheelHold();
    });

    room.onMessage("LobbyError", (event: { code?: string; message?: string }) => {
      const code = typeof event?.code === "string" ? event.code : "";
      if (!code) return;
      const rawMessage = typeof event.message === "string" ? event.message : undefined;
      const message = isRoundsErrorCode(code)
        ? roundsErrorMessage(code, rawMessage)
        : rawMessage?.trim()
          ? rawMessage
          : code === "NOT_ENOUGH_PLAYERS"
            ? "At least 2 players are required to start."
            : "The room could not continue.";
      store.dispatch(setLobbyError({ code, message }));
    });

    room.state.players?.onAdd?.((player: any, sessionId: string) => {
      player.onChange(() => {
        this.syncPlayersState(room);
      });
    });

    room.onStateChange((state: any) => {
      const progress = readProgress(state);
      if (state?.phase === "gameover") {
        holdGameOver(room, readGameOver(state));
      }

      import('react-redux').then(({ batch }) => {
        // Game over was already written from this patch or from GameOverEvent.
        // A second copy of the same podium would render the screen again.
        if (gameOverActive) return;
        // A patch can resolve after the socket is already gone.
        if (currentRoom !== room) return;
        batch(() => {
          if (currentRoom !== room) return;
          if (progress.matchLengthSupported) matchLengthSupported = true;
          store.dispatch(applyRoomProgress(progress));
          store.dispatch(setTimer(state.timer));
          store.dispatch(setGameType(state.currentGameType));
          store.dispatch(setGameCategory(state.currentCategory));
          const podium = normalizePodium(state.podium);
          store.dispatch(setPodium(podium));

          if (state.selectedPlayers) {
            store.dispatch(setSelectedPlayers(state.selectedPlayers.toArray()));
          }
          if (state.lastWinners) {
            store.dispatch(setLastWinners(state.lastWinners.toArray()));
          }
          if (state.lastLosers) {
            store.dispatch(setLastLosers(state.lastLosers.toArray()));
          }
          store.dispatch(setDrinkChains(readDrinkChains(state.drinkChains)));
          if (state.lastGameResult !== undefined) {
            store.dispatch(setLastGameResult(state.lastGameResult));
          }
          store.dispatch(setBettingState({
            isBettingRound: state.isBettingRound === true,
            bettingPot: readNumber(state.bettingPot),
            bettingRefunded: state.bettingRefunded === true,
            phase: typeof state.phase === "string" ? state.phase : "",
          }));
          if (typeof state.readyCount === "number") {
            store.dispatch(setReadyCount(state.readyCount));
          }
          if (typeof state.connectedCount === "number") {
            store.dispatch(setConnectedCount(state.connectedCount));
          }

          const notice = store.getState().lobby.lobbyError;
          if (notice?.code === "NOT_ENOUGH_PLAYERS") {
            const enough =
              typeof state.connectedCount === "number" && state.connectedCount >= 2;
            const leftReadyGate = state.phase !== "lobby" && state.phase !== "chart";
            if (enough || leftReadyGate) {
              store.dispatch(clearLobbyError());
            }
          }

          this.syncPlayersState(room);
        });
      });
    });

    if (room.state) {
      // The join handshake can deliver ROOM_STATE before this listener exists.
      const progress = readProgress(room.state);
      if (progress.matchLengthSupported) matchLengthSupported = true;
      store.dispatch(applyRoomProgress(progress));
    }

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
      endWheelHold();
      if (gameOverActive) {
        // openPodium already opened the podium. Replacing it again remounts the screen.
        if (gameOverPayload) {
          store.dispatch(setGameOver(gameOverPayload));
        } else {
          store.dispatch(setGamePhase("gameover"));
        }
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
    const playersArray: LobbyPlayer[] = [];
    room.state?.players?.forEach((player: any, key: string) => {
      if (!player) return;
      playersArray.push({
        id: player.id,
        name: player.name,
        isReady: !!player.isReady,
        isHost: !!player.isHost,
        isConnected: player.isConnected !== false,
        score: player.score || 0,
        drinks: player.drinks || 0,
        gameScore: player.gameScore || 0,
        gameData: player.gameData || "",
        cards: player.cards
          ? player.cards.toArray
            ? player.cards.toArray()
            : Array.from(player.cards)
          : [],
        earnedRounds: readEarnedRounds(player.earnedRounds),
        activeEffects: player.activeEffects || "",
        betWager: readNumber(player.betWager),
        betPayout: readNumber(player.betPayout),
        betNet: readNumber(player.betNet),
        betRank: readNumber(player.betRank),
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
