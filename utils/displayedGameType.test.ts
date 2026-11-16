import {
  displayedGameType,
  displayedRoundNumber,
  isBettingRoundNumber,
  roundIsBetting,
  type GameTypeSource,
} from "./betting";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function source(overrides: Partial<GameTypeSource> = {}): GameTypeSource {
  return {
    phase: "chart",
    roundCount: 4,
    currentGameType: "2v2",
    isBettingRound: false,
    bettingRound: null,
    ...overrides,
  };
}

/** Cases for the betting-round mode label. Run with `npx tsx utils/displayedGameType.test.ts`. */
export function runDisplayedGameTypeTests(): void {
  assertEqual(isBettingRoundNumber(0), false, "round 0");
  assertEqual(isBettingRoundNumber(1), false, "round 1");
  assertEqual(isBettingRoundNumber(4), false, "round 4");
  assertEqual(isBettingRoundNumber(5), true, "round 5");
  assertEqual(isBettingRoundNumber(10), true, "round 10");
  assertEqual(isBettingRoundNumber(-5), false, "negative");
  assertEqual(isBettingRoundNumber(5.5), false, "fraction");

  assertEqual(displayedRoundNumber("chart", 4), 5, "chart is the next round");
  assertEqual(displayedRoundNumber("wheel", 4), 5, "wheel is the next round");
  assertEqual(displayedRoundNumber("countdown", 9), 10, "countdown is the next round");
  assertEqual(displayedRoundNumber("playing", 9), 10, "playing is the next round");
  assertEqual(displayedRoundNumber("resolution", 5), 5, "resolution is roundCount");
  assertEqual(displayedRoundNumber("gameover", 10), 10, "game over is roundCount");
  assertEqual(displayedRoundNumber("lobby", 4), null, "lobby has no round");

  // Chart before the spin, and a rejoin into that chart. The server still
  // has the previous round's mode, and may not have flipped isBettingRound yet.
  const chartBeforeFive = source({ currentGameType: "2v2", isBettingRound: false });
  assertEqual(roundIsBetting(chartBeforeFive), true, "round 5 chart is betting");
  assertEqual(displayedGameType(chartBeforeFive), "BATTLE ROYALE", "2v2 hidden before the spin");
  assertEqual(
    displayedGameType(source({ currentGameType: "1v1", isBettingRound: true })),
    "BATTLE ROYALE",
    "1v1 hidden on rejoin",
  );

  // A normal round keeps the stored short code, including a stale "BR".
  assertEqual(
    displayedGameType(source({ roundCount: 5, currentGameType: "BR", isBettingRound: false })),
    "BR",
    "round 6 keeps BR",
  );
  assertEqual(
    displayedGameType(source({ roundCount: 1, currentGameType: "2v2", isBettingRound: true })),
    "2v2",
    "stale betting flag does not relabel round 2",
  );
  assertEqual(
    displayedGameType(source({ roundCount: 0, currentGameType: "1v1" })),
    "1v1",
    "first round stays 1v1",
  );

  assertEqual(
    displayedGameType(source({ phase: "wheel", roundCount: 4, currentGameType: "2v2" })),
    "BATTLE ROYALE",
    "wheel of round 5",
  );
  assertEqual(
    displayedGameType(source({ phase: "playing", roundCount: 4, currentGameType: "1v1" })),
    "BATTLE ROYALE",
    "playing round 5",
  );
  assertEqual(
    displayedGameType(source({ phase: "countdown", roundCount: 2, currentGameType: "2v2" })),
    "2v2",
    "countdown of round 3",
  );
  assertEqual(
    displayedGameType(source({ phase: "resolution", roundCount: 5, currentGameType: "2v2" })),
    "BATTLE ROYALE",
    "resolution of round 5",
  );
  assertEqual(
    displayedGameType(source({ phase: "resolution", roundCount: 4, currentGameType: "1v1" })),
    "1v1",
    "resolution of round 4",
  );
  assertEqual(
    displayedGameType(source({ phase: "gameover", roundCount: 10, currentGameType: "2v2" })),
    "BATTLE ROYALE",
    "game over on round 10",
  );
  assertEqual(
    displayedGameType(source({ phase: "gameover", roundCount: 9, currentGameType: "1v1" })),
    "1v1",
    "game over on round 9",
  );

  // An event for round 5 must not mark the following chart.
  assertEqual(
    roundIsBetting(
      source({
        roundCount: 5,
        isBettingRound: false,
        bettingRound: { roundCount: 5, mode: "BR" },
      }),
    ),
    false,
    "round 6 ignores the previous BettingRoundEvent",
  );

  // Lobby has no round number, so the server flag and the event are the signal.
  assertEqual(
    roundIsBetting(source({ phase: "lobby", roundCount: 0, isBettingRound: true })),
    true,
    "lobby uses isBettingRound",
  );
  assertEqual(
    roundIsBetting(
      source({
        phase: "lobby",
        roundCount: 0,
        isBettingRound: false,
        bettingRound: { roundCount: 5, mode: "BR" },
      }),
    ),
    true,
    "lobby uses BettingRoundEvent",
  );
  assertEqual(
    displayedGameType(source({ phase: "lobby", roundCount: 0, currentGameType: "" })),
    "",
    "lobby without a flag keeps the stored type",
  );
}

runDisplayedGameTypeTests();
