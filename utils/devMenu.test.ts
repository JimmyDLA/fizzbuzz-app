import {
  DEV_AWARD_CARD,
  DEV_START_WHEEL,
  classifyDevCommandResult,
  devAwardCardMessage,
  devAwardLandedMessage,
  devCardLanded,
  devCommandNotSentMessage,
  devStartWheelMessage,
  devToolsIgnoredMessage,
  publishDevCommandNotice,
  readCardList,
  subscribeDevCommandNotice,
} from "./devMenu";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: expected ${right}, got ${left}`);
  }
}

/** DEV MODE payloads and the silent-server warning. Run via `npm test`. */
export function runDevMenuTests(): void {
  assertDeepEqual(
    devStartWheelMessage("1v1", "Tapping Race", ["host", "guest"]),
    { type: "1v1", category: "Tapping Race", selectedPlayers: ["host", "guest"] },
    "force start payload",
  );
  assertDeepEqual(
    devAwardCardMessage("guest", "DOUBLE POINTS"),
    { targetPlayerId: "guest", cardId: "DOUBLE POINTS" },
    "award payload",
  );
  assertEqual(DEV_START_WHEEL, "dev_start_wheel", "wheel message name");
  assertEqual(DEV_AWARD_CARD, "dev_award_card", "card message name");

  const ignored = devToolsIgnoredMessage(DEV_START_WHEEL);
  assertEqual(ignored.includes("ALLOW_DEV_TOOLS=1"), true, "names the flag");
  assertEqual(ignored.includes("NODE_ENV"), true, "names NODE_ENV");
  assertEqual(ignored.includes("npm start"), true, "names the default script");

  assertEqual(
    classifyDevCommandResult({
      command: DEV_START_WHEEL,
      phase: "wheel",
      rejection: null,
      cardLanded: false,
    }),
    null,
    "a wheel means the force landed",
  );
  assertEqual(
    classifyDevCommandResult({
      command: DEV_START_WHEEL,
      phase: "chart",
      rejection: "At least 2 players are required to start.",
      cardLanded: false,
    }),
    "At least 2 players are required to start.",
    "a server rejection is shown as sent",
  );
  const silentWheel = classifyDevCommandResult({
    command: DEV_START_WHEEL,
    phase: "chart",
    rejection: null,
    cardLanded: false,
  });
  assertEqual(silentWheel, devToolsIgnoredMessage(DEV_START_WHEEL), "a silent wheel is the gate");

  assertEqual(
    classifyDevCommandResult({
      command: DEV_AWARD_CARD,
      phase: "chart",
      rejection: null,
      cardLanded: true,
    }),
    null,
    "a card that arrived is success",
  );
  assertEqual(
    classifyDevCommandResult({
      command: DEV_AWARD_CARD,
      phase: "chart",
      rejection: "   ",
      cardLanded: false,
    }),
    devToolsIgnoredMessage(DEV_AWARD_CARD),
    "blank rejection still means the gate",
  );

  assertEqual(devCardLanded([], ["TURBO"], "TURBO"), true, "first card lands");
  assertEqual(devCardLanded(["TURBO"], ["TURBO", "SHIELD"], "SHIELD"), true, "second card lands");
  assertEqual(devCardLanded(["TURBO"], ["TURBO"], "TURBO"), false, "same hand is not a new card");
  assertEqual(devCardLanded(["TURBO", "SHIELD"], ["TURBO"], "SHIELD"), false, "a discard is not an award");
  assertEqual(devAwardLandedMessage("TURBO", "Ada"), "Awarded TURBO to Ada.", "success copy");
  assertEqual(
    devCommandNotSentMessage(DEV_AWARD_CARD),
    "dev_award_card was not sent. This client is not in a room.",
    "missing room copy",
  );

  assertDeepEqual(readCardList(["TURBO"]), ["TURBO"], "array cards");
  assertDeepEqual(
    readCardList({ toArray: () => ["SHIELD", "RESPIN"] }),
    ["SHIELD", "RESPIN"],
    "schema cards",
  );
  assertDeepEqual(readCardList(null), [], "missing cards");

  const seen: Array<string | null> = [];
  const unsubscribe = subscribeDevCommandNotice((notice) => {
    seen.push(notice ? notice.message : null);
  });
  publishDevCommandNotice({
    command: DEV_AWARD_CARD,
    ok: false,
    message: "ignored",
  });
  publishDevCommandNotice(null);
  unsubscribe();
  publishDevCommandNotice({
    command: DEV_START_WHEEL,
    ok: true,
    message: "later",
  });
  assertDeepEqual(seen, ["ignored", null], "unsubscribe stops notices");
}

runDevMenuTests();
