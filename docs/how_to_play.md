# FizzBuzz: Game Overview and How to Play

FizzBuzz is a real-time multiplayer party game designed for house parties, game nights, and social gatherings. Players join directly from their smartphones to compete in rapid-fire mini-games, earn points, deploy specialty power-up cards, and hand out drinking penalties.

Inspired by the chaotic mini-game showdowns of **Mario Party** and **WarioWare**, blended with classic house party drinking games (for players of legal drinking age), FizzBuzz requires zero physical game pieces—just everyone on their phones in the same room.

---

## 1. Quick Pitch

- **Platform**: Cross-platform mobile web and native app (iOS / Android).
- **Format**: Real-time room-based multiplayer via WebSockets.
- **Player Count**: 2 to 12 players.
- **Round Duration**: 10 to 60 seconds per mini-game, depending on the game.
- **Core Objective**: Score points by winning mini-games, avoid drinking penalties, and use strategic specialty cards to outmaneuver friends.

```
+------------------------------------------------------------------------+
|                            THE FIZZBUZZ CYCLE                          |
|                                                                        |
|   1. LOBBY             2. WHEEL SPIN         3. PRACTICE (OPTIONAL)    |
|   Join via room code   Match type & game     Test controls safely      |
|   and hit Ready        are drawn at random   in Practice Mode          |
|           |                     |                     |                |
|           v                     v                     v                |
|   6. VICTORY           5. RESOLUTION         4. MINI-GAME MATCH        |
|   Leaderboard crown    Winners get points;   Intense 10-60s showdown   |
|   and party champion   losers drink          live on all phones        |
+------------------------------------------------------------------------+
```

---

## 2. Getting Started

### Step 1: Create or Join a Room
1. Open the FizzBuzz app on your smartphone.
2. Enter your nickname.
3. Choose either:
   - **Create Game**: Creates a unique 4-digit room code and makes you the Room Host.
   - **Join Game**: Enter the 4-digit room code shared by your host.

### Step 2: The Lobby
- Once in the lobby, all joined players appear as retro Neobrutalist cards on screen.
- Every player taps **READY**.
- Once every connected player is ready, and at least two players are in the room, the room moves to the **Chart & Wheel** arena on its own and everyone's ready flag clears.

### Step 3: Ready to Spin
- On the chart, every player, including the host, taps **Ready to Spin**. The screen shows how many connected players are ready, such as **3/5 ready**, and each player's ready state.
- Anyone can cancel. The wheel waits until every connected player is ready. There is no timer.
- A player who has disconnected shows as away and does not hold the room. A player who joins during this step starts not ready.
- Readying up with fewer than two connected players shows that at least 2 players are required.
- When every connected player is ready, the wheel spins by itself. Ready flags clear again. The players the wheel selected then use **Ready to Play** to start the round.

---

## 3. Core Game Loop

Each round follows a clear three-phase sequence:

### Phase 1: The Wheel Spin
Each round starts on the chart. Every connected player taps **Ready to Spin**. When all of them are ready, the wheel spins on its own and decides three variables:
1. **Match Type**:
   - **1v1**: Two selected players go head-to-head.
   - **2v2**: Four players split into two co-op teams.
   - **Battle Royale (BR)**: All players in the room compete simultaneously.
2. **Mini-Game Category**: One of the 12 mini-games is randomly drawn.
3. **Contestants**: The server selects which players must take the stage.

### Phase 2: Practice Mode or Play
- **Practice Mode ("Try It")**: Any player can tap "Try It" before the match launches to test controls in an isolated sandbox powered by [`PracticeRoom.ts`](file:///Users/jimmydla/Code/fizzbuzz-server/src/rooms/PracticeRoom.ts) without risk of penalties.
- **Play ("Ready to Play")**: The contestants selected by the wheel tap ready. When every selected player who is still connected is ready, a 5-second countdown starts the round. A Wild Card can still be played in this window, and the countdown waits until that play is finished.

### Phase 3: The Match
- Active contestants battle in real-time on their phones.
- Spectators watch real-time score updates, progress bars, and countdown timers.

### Phase 4: Resolution & Penalties
- **Points Awarded**: Round winners receive **+3 points** toward the overall leaderboard.
- **Drink Penalties**: Losers receive a drink penalty (e.g., 1 drink/sip).
- **Ties**: If a mini-game ends in a tie, all tied players win. Rock Paper Scissors is the exception: RPS ties go to a sudden-death rematch until someone wins, and tied rounds give no score and no drink.
- **Specialty Cards**: Every 3 completed rounds, the server awards specialty cards, with the rarest card going to the player in last place. Each player can hold a maximum of 2 cards. If you would earn a third card while already at the cap, you choose which card to discard.

---

## 4. The 12 Mini-Games

Each mini-game tests a distinct physical or mental skill.

### 1. Tapping Race
- **Component**: [`TappingRaceUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/TappingRaceUI.tsx)
- **Concept**: Pure speed and finger stamina.
- **How to Play**: Tap the giant button as fast as humanly possible before the round timer reaches zero.
- **Winning Strategy**: Use alternating index and middle fingers for maximum tap frequency. Turbo cards give a 1.5x multiplier.

### 2. Trivia
- **Component**: [`TriviaUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/TriviaUI.tsx)
- **Concept**: High-pressure general knowledge.
- **How to Play**: Answer rapid-fire multiple-choice questions across pop culture, science, geography, and history.
- **Penalty Catch**: Choosing a wrong answer triggers a temporary lockout delay, giving opponents a free window to answer.

### 3. Math Problem
- **Component**: [`MathProblemUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/MathProblemUI.tsx)
- **Concept**: Mental arithmetic under adrenaline.
- **How to Play**: Solve addition, subtraction, and multiplication equations. Tap the correct number tile before opponents can calculate it.

### 4. Hot Potato
- **Component**: [`HotPotatoUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/HotPotatoUI.tsx)
- **Concept**: Elimination game of panic and passing.
- **How to Play**: The potato is ticking down secretly. If you hold the potato, tap a rival player's name to fling it to them.
- **Losing Condition**: Whosoever holds the potato when the hidden fuse detonates takes the drink.

### 5. Lumber Cut
- **Component**: [`LumberCutUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/LumberCutUI.tsx)
- **Concept**: Rhythm, timing, and cooperative synchronization.
- **How to Play**:
  - In **2v2**: Teammates must alternate push and pull strokes in a smooth cadence to saw through the log. Pulling while your partner pushes jams the blade!
  - In **BR**: Solo rapid rhythm cutting.

### 6. Rock Paper Scissors
- **Component**: [`RockPaperScissorsUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/RockPaperScissorsUI.tsx)
- **Concept**: Mind games and psychological reads.
- **How to Play**: Lock in Rock, Paper, or Scissors before the countdown ends. The game reveals choices simultaneously with retro animated sound effects. Ties trigger an immediate sudden-death tiebreaker: the round replays until someone wins, and tied rounds give no score and no drink.

### 7. Cyclone
- **Component**: [`CycloneUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/CycloneUI.tsx)
- **Concept**: Arcade reflex and timing precision.
- **How to Play**: A light travels rapidly around a circular track. Tap your screen at the precise millisecond the light hits the target bullseye zone. Closest distance wins.

### 8. Balloon Inflate
- **Concept**: A race to fill your balloon to 100%.
- **Component**: [`BalloonInflateUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/BalloonInflateUI.tsx)
- **How to Play**: Tap to pump air into your balloon. Reaching 100% wins immediately. If time expires first, the biggest balloon wins.

### 9. Simon Says
- **Component**: [`SimonSaysUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/SimonSaysUI.tsx)
- **Concept**: Short-term visual and acoustic memory.
- **How to Play**: Watch the pattern of colored pads light up with sound cues, then repeat the exact sequence. Each successful round lengthens the chain and increases the speed.

### 10. Scrabble (Anagram Sprint)
- **Component**: [`ScrabbleUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/ScrabbleUI.tsx)
- **Concept**: Vocabulary, pattern recognition, and anagram solving.
- **How to Play**: Unscramble randomized letter tiles to assemble valid English words. Validated instantly against a dictionary of over 270,000 words.

### 11. Screen Painting
- **Component**: [`ScreenPaintingUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/ScreenPaintingUI.tsx)
- **Concept**: Finger painting coverage sprint powered by Skia 2D Canvas.
- **How to Play**: Vigorously swipe across your touch screen to cover as much surface area with paint as possible. First player to reach the required percentage threshold wins.

### 12. Perfection
- **Component**: [`PerfectionUI.tsx`](file:///Users/jimmydla/Code/fizzbuzz/components/games/PerfectionUI.tsx)
- **Concept**: Shape recognition and manual dexterity.
- **How to Play**: Drag randomized geometric shapes into their exact board cutouts before the mechanical pop timer springs all pieces into the air.

---

## 5. Specialty Cards & Strategic Power-Ups

Specialty cards add game theory depth and revenge dynamics. They are awarded automatically **every 3 rounds**, with the rarest card going to the player in last place. Each player can hold a maximum of **2 cards** at a time. If you would earn a third card while already at the cap, you choose which card to discard.

Cards are stored in your personal dock on [`ChartScreen`](file:///Users/jimmydla/Code/fizzbuzz/app/chart.tsx). A Wild Card can be played on the chart, including while players are tapping Ready to Spin, and again after the wheel lands, until the 5-second countdown starts. Playing one after the wheel replaces the landed mini-game, mode, and contestants. The countdown does not start until that play resolves and the selected contestants ready up.

```
+------------------+-------------------------------------------------------+
| CARD             | EFFECT                                                |
+------------------+-------------------------------------------------------+
| RESPIN           | Reject the current wheel outcome and force a full     |
| (Emerald)        | redraw of the mini-game category and game mode.       |
|                  |                                                       |
| SHIELD           | Protect yourself from drinking penalties on loss.     |
| (Pink)           | Pass the drink to any rival. If they hold a Shield,   |
|                  | they can chain it back with escalating drinks!        |
|                  |                                                       |
| TURBO            | Grants a 1.5x efficiency boost or tap multiplier      |
| (Cyan)           | in applicable mini-games for that round. In Math      |
|                  | and Trivia, Turbo gives +1 point instead of 1.5x.     |
|                  |                                                       |
| DOUBLE POINTS    | Multiplies your round victory reward from             |
| (Amber)          | +3 points to +6 points.                               |
|                  |                                                       |
| WILD CARD        | Override the wheel completely. Pick the mini-game,    |
| (Purple)         | the game mode, and the participating players.         |
+------------------+-------------------------------------------------------+
```

### The Shield Chain Mechanic
The Shield card is FizzBuzz's most infamous social weapon: (full rules: [final_specialty_cards.md](final_specialty_cards.md))
1. Player A loses and activates **Shield** to pass their 1 drink to Player B.
2. If Player B also holds a **Shield**, they can counter-deflect back to Player A or to Player C.
3. Every linked deflection escalates the penalty (+1 additional drink per chain step: 1 drink -> 2 drinks -> 3 drinks -> 4 drinks), with no cap. Each deflection uses up that player's Shield, and you can target anyone, including your own teammate in 2v2.
4. The first player without a Shield must consume all accumulated drinks!

---

## 6. Game Modes Explained

### Battle Royale (BR)
- All connected players compete against each other simultaneously.
- Only 1st place earns +3 points; every other player drinks.
- High energy and maximum room engagement.

### 1v1 Showdown
- Two players are singled out by the wheel to duel.
- The rest of the room acts as the cheering, jeering audience.
- Winner claims bragging rights; loser drinks.

### 2v2 Team Clash
- Players are randomly paired into two teams of two.
- Requires verbal communication and cooperative coordination (especially in Lumber Cut and team challenges).
- Both members of the losing team take the drinking penalty.

---

## 7. Disconnection Resilience

House party internet can be spotty. FizzBuzz handles connection drops smoothly:
- **Grace Window (120 seconds)**: If your phone locks or drops Wi-Fi, your score, drink history, and specialty cards are preserved in the server cache. Simply reopen the room to rejoin seamlessly.
- **Dynamic Host Handoff**: If the host drops, hosting passes immediately to the next player by join order so the party never stops.
- **Match Continuity**: In Battle Royale with 2 or more remaining players, games continue uninterrupted if someone disconnects.

---

## 8. House Rules & Responsible Drinking

FizzBuzz is built purely for social entertainment and good times among friends:

1. **Drinks Equal Sips**: In all standard rules, "1 drink" refers to one sip or gulp of your chosen beverage, never an entire cup or shot.
2. **Pacing**: Players are encouraged to alternate with water throughout the night.
3. **Non-Alcoholic Friendly**: The competitive mechanics work equally well with water, soda, iced tea, energy drinks, or light physical forfeits (such as 5 push-ups per drink).
4. **Legal Age**: Alcohol-related gameplay is strictly intended for individuals of legal drinking age in their respective jurisdiction.
5. **Never Drink and Drive**: Arrange designated drivers or rideshares before playing.
