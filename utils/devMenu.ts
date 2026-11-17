/**
 * Chart DEV MODE wire format. The server registers these names even when the
 * tools are off; a disabled server drops the message and sends nothing back.
 */

export const DEV_START_WHEEL = "dev_start_wheel";
export const DEV_AWARD_CARD = "dev_award_card";

export type DevCommandName = typeof DEV_START_WHEEL | typeof DEV_AWARD_CARD;

export interface DevCommandNotice {
  command: DevCommandName;
  ok: boolean;
  message: string;
}

export interface DevStartWheelPayload {
  type: string;
  category: string;
  selectedPlayers: string[];
}

export interface DevAwardCardPayload {
  targetPlayerId: string;
  cardId: string;
}

/** Same object `room.send("dev_start_wheel", …)` puts on the wire. */
export function devStartWheelMessage(
  type: string,
  category: string,
  selectedPlayers: readonly string[],
): DevStartWheelPayload {
  return { type, category, selectedPlayers: [...selectedPlayers] };
}

/** Same object `room.send("dev_award_card", …)` puts on the wire. */
export function devAwardCardMessage(targetPlayerId: string, cardId: string): DevAwardCardPayload {
  return { targetPlayerId, cardId };
}

export function devAwardLandedMessage(cardId: string, playerName: string): string {
  return `Awarded ${cardId} to ${playerName}.`;
}

export function devCommandNotSentMessage(command: DevCommandName): string {
  return `${command} was not sent. This client is not in a room.`;
}

/**
 * Shown when the room does not change and the server sent no error.
 * `npm start` leaves ALLOW_DEV_TOOLS and NODE_ENV unset, which does this.
 */
export function devToolsIgnoredMessage(command: DevCommandName): string {
  const detail =
    command === DEV_AWARD_CARD
      ? "A hand that is already waiting to discard a card is skipped the same way."
      : "dev_start_wheel also has to be sent during chart.";
  return (
    `${command} did not change the room. ` +
    "The server sends no reply unless it was started with ALLOW_DEV_TOOLS=1 and NODE_ENV=development or NODE_ENV=test, " +
    "and the sender is the only connected host. " +
    detail +
    " npm start does not set those variables."
  );
}

const WHEEL_APPLIED_PHASES = new Set(["wheel", "countdown", "playing"]);

/**
 * Null when the room applied the command. Otherwise the text to show the host.
 * A server `LobbyError` wins over the "tools are off" copy.
 */
export function classifyDevCommandResult(input: {
  command: DevCommandName;
  phase: string;
  rejection: string | null;
  cardLanded: boolean;
}): string | null {
  if (input.command === DEV_START_WHEEL) {
    if (WHEEL_APPLIED_PHASES.has(input.phase)) return null;
    const rejection = input.rejection?.trim();
    if (rejection) return rejection;
    return devToolsIgnoredMessage(input.command);
  }
  if (input.cardLanded) return null;
  const rejection = input.rejection?.trim();
  if (rejection) return rejection;
  return devToolsIgnoredMessage(input.command);
}

/** True when `cardId` was added on top of the hand we snapshotted. */
export function devCardLanded(
  before: readonly string[],
  after: readonly string[],
  cardId: string,
): boolean {
  if (!cardId || after.length <= before.length) return false;
  const extras = after.slice();
  for (const held of before) {
    const index = extras.indexOf(held);
    if (index >= 0) extras.splice(index, 1);
  }
  return extras.includes(cardId);
}

export function readCardList(cards: unknown): string[] {
  if (cards == null) return [];
  if (Array.isArray(cards)) return cards.map((entry) => String(entry));
  const schema = cards as { toArray?: () => unknown[] };
  if (typeof schema.toArray === "function") {
    try {
      const listed = schema.toArray();
      return Array.isArray(listed) ? listed.map((entry) => String(entry)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

type NoticeListener = (notice: DevCommandNotice | null) => void;

const noticeListeners = new Set<NoticeListener>();

export function subscribeDevCommandNotice(listener: NoticeListener): () => void {
  noticeListeners.add(listener);
  return () => {
    noticeListeners.delete(listener);
  };
}

export function publishDevCommandNotice(notice: DevCommandNotice | null): void {
  noticeListeners.forEach((listener) => listener(notice));
}
