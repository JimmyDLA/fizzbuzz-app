# FizzBuzz Technology Stack Specification

This document details the complete technology stack, architectural choices, and dependency matrix powering the **FizzBuzz** real-time multiplayer mobile gaming application and authoritative backend server.

---

## 1. Architectural Overview

FizzBuzz is architected around a client-server model optimized for low-latency, real-time multiplayer interactions across mobile platforms.

```
+-------------------------------------------------------------------------+
|                              MOBILE CLIENT                              |
|                          (fizzbuzz / React Native)                      |
|                                                                         |
|  +-------------------+  +--------------------+  +--------------------+  |
|  |    Expo Router    |  |  NativeWind / CSS  |  |   Redux Toolkit    |  |
|  | (File Navigation) |  |   (Neobrutalism)   |  |   (Lobby State)    |  |
|  +-------------------+  +--------------------+  +--------------------+  |
|  +-------------------+  +--------------------+  +--------------------+  |
|  |  Reanimated 4.7   |  |   Skia 2.14 2D     |  |   Gesture Handler  |  |
|  |  (Layout / 60fps) |  | (Screen Painting)  |  |   (Touch Engine)   |  |
|  +-------------------+  +--------------------+  +--------------------+  |
+------------------------------------+------------------------------------+
                                     |
                                     | WebSockets (Persistent Session)
                                     | Binary State Delta Synchronization
                                     v
+-------------------------------------------------------------------------+
|                           GAME SERVER CLUSTER                           |
|                       (fizzbuzz-server / Node.js)                       |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                    Colyseus 0.17 Game Server                      |  |
|  |   - WebSocketTransport (5s Ping, 90s Disconnect Grace Window)     |  |
|  |   - Express 5.2 HTTP Interface + CORS Protection                  |  |
|  +-------------------------------------------------------------------+  |
|  +-----------------------------------+  +----------------------------+  |
|  |            LobbyRoom              |  |        PracticeRoom        |  |
|  |  - Wheel Spinning & Matchmaking   |  |  - Solo / Free Play Mode   |  |
|  |  - Disconnection Resilience       |  |  - Zero Consequence Trials |  |
|  |  - Specialty Card Distributions   |  +----------------------------+  |
|  +-----------------------------------+                                  |
|  +-------------------------------------------------------------------+  |
|  |                      12 Mini-Game Engines                         |  |
|  |  - Hot Potato       - Balloon Inflate   - Tapping Race            |  |
|  |  - Cyclone          - Lumber Cut        - Rock Paper Scissors     |  |
|  |  - Trivia           - Math Problem      - Scrabble                |  |
|  |  - Screen Painting  - Simon Says        - Perfection              |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 2. Mobile Client Stack (`fizzbuzz`)

The client is a cross-platform mobile application targeting iOS and Android devices, built with modern React Native and Expo.

### 2.1 Core Runtime and Frameworks

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Expo SDK** | `~58.0.20` | Core application container, runtime, and native module bridges |
| **React Native** | `0.88.0` | Mobile framework with New Architecture and modern component typing (`ViewInstance`) |
| **React** | `19.3.0` | Component lifecycle, hooks, and React Compiler integration |
| **React DOM** | `19.3.0` | Web fallback support (`expo start --web`) |
| **TypeScript** | `~6.0.3` | Strict static typing across all screens, hooks, and components |

### 2.2 Navigation and Routing

- **Expo Router (`~58.0.27`)**: File-based router using directory structures under `/app` (`index.tsx`, `lobby.tsx`, `chart.tsx`, `game.tsx`).
- **Typed Routes (`experiments.typedRoutes: true`)**: Compile-time route generation and link validation.
- **React Navigation Core**:
  - `@react-navigation/native` (`^7.1.8`)
  - `@react-navigation/bottom-tabs` (`^7.4.0`)
  - `@react-navigation/elements` (`^2.6.3`)
  - `react-native-screens` (`~4.30.0`)
  - `react-native-safe-area-context` (`~5.10.1`)

### 2.3 UI Styling and Theme Engine

- **NativeWind (`^4.2.6`)**: Utility-first styling engine bringing Tailwind CSS v3 directly to native elements without runtime JS-bridge overhead.
- **Tailwind CSS (`^3.3.2`)**: Design token configuration via `tailwind.config.js`.
- **Neobrutalism Design System**: High-contrast borders (3-6px black/white), retro drop-shadows with hard offsets, vibrant retro color palette, and dynamic light/dark theme toggle.
- **Icons**:
  - `@expo/vector-icons` (`^15.0.3`) - MaterialCommunityIcons, Ionicons, FontAwesome
  - `expo-symbols` (`~58.0.4`) - Apple SF Symbols support on iOS

### 2.4 Graphics, Gestures and Animation

- **@shopify/react-native-skia (`2.14.0`)**: High-performance 2D canvas drawing used in games such as Screen Painting. Uses `Skia.PathBuilder` for efficient path recording and pixel-level coverage analysis.
- **react-native-reanimated (`4.7.1`)**: Native thread 60fps animations for wheel rotation, modals, floating card trays, and countdown sequences.
- **react-native-worklets (`0.13.0`)**: Worklet runtime powering high-frequency gesture computations on the UI thread.
- **react-native-gesture-handler (`~3.3.0`)**: Multi-touch, pan, and tap gesture processing.
- **lottie-react-native (`~7.5.0`)**: Vector animations for confetti celebrations and victory bursts.
- **@react-native-community/slider (`5.2.1`)**: Precision sliders for volume and game threshold configurations.

### 2.5 Audio and Haptics

- **expo-audio (`~58.0.10`)**: Low-latency sound playback for mini-game effects (whistles, buzzers, splats, explosions, correct/incorrect bells) and background ambient loops.
- **expo-haptics (`~58.0.7`)**: Tactile haptic feedback for button taps, error states, and game countdown ticks.

### 2.6 State Management and Networking

- **Redux Toolkit (`@reduxjs/toolkit` `^2.11.2`, `react-redux` `^9.2.0`)**: Client-side state container managing lobby settings, player identity, sound/theme preferences, and active room data.
- **Colyseus SDK (`colyseus.js` `^0.16.22`, `@colyseus/sdk` `^0.17.35`)**: Real-time room listeners, binary state deserialization, and game action dispatchers.
- **Node.js Polyfills for React Native**:
  - `node-libs-react-native` (`^1.2.1`)
  - `crypto-browserify` (`^3.12.1`)
  - `stream-browserify` (`^3.0.0`)
  - `browserify-zlib` (`^0.2.0`)
  - `https-browserify` (`^1.0.0`)
  - `react-native-url-polyfill` (`^3.0.0`)
  - `react-native-get-random-values` (`~1.11.0`)

---

## 3. Authoritative Game Server Stack (`fizzbuzz-server`)

The backend server is an authoritative, real-time WebSocket cluster responsible for session management, lobby coordination, mini-game execution, and game theory score calculations.

### 3.1 Server Runtime and Frameworks

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` | Server runtime environment |
| **TypeScript** | `^6.0.2` | Typed codebase compiled via `ts-node` (`^10.9.2`) |
| **@colyseus/core** | `^0.17.39` | Authoritative game room lifecycle and state management |
| **@colyseus/ws-transport** | `^0.17.11` | High-throughput WebSocket transport layer |
| **@colyseus/schema** | `^4.0.26` | Memory-efficient binary schema serialization (`@type`) |
| **Express** | `^5.2.1` | HTTP API foundation and health check endpoints |
| **cors** | `^2.8.6` | Cross-Origin Resource Sharing control |

### 3.2 State Management and Architecture

- **`src/rooms/LobbyRoom.ts`**: Central room coordinator.
  - Manages player connections, readiness states, and host assignments.
  - Controls phases: `lobby` -> `chart` -> `wheel` -> `countdown` -> `playing` -> `resolution`.
  - Disconnect handling: preserves player statistics in cache during temporary disconnects (120-second grace window), allowing players to rejoin seamlessly without losing scores, drink counts, or specialty cards.
  - Dynamic host handoff: automatically transfers host status if the active host disconnects.
  - Match survival logic: in Battle Royale mode with 2 or more active connected players, matches continue uninterrupted when a participant leaves; in 1v1, 2v2, or when fewer than 2 players remain, rooms safely abort to the chart lobby.
- **`src/rooms/PracticeRoom.ts`**: Isolated sandbox for players to practice any mini-game together without affecting leaderboard scores or drinking penalties.
- **`src/rooms/schema/LobbyState.ts`**: Colyseus state schema syncing:
  - `players` (`MapSchema<Player>`): player identity, readiness, score, drinks, game scores, cards, active effects, and connection status.
  - `phase`, `timer`, `roundCount`, `currentGameType`, `currentCategory`.
  - `selectedPlayers` (`ArraySchema<string>`): participants selected for the current round.
  - `lastWinners`, `lastLosers`, `lastGameResult`: round outcomes and scoreboard data.

### 3.3 Mini-Game Implementations (`src/games/`)

All mini-games implement the standard `IMiniGame` interface:
```typescript
export interface IMiniGame {
  onInit(state: LobbyState): void;
  onMessage(client: Client, message: any, state: LobbyState): void;
  onTick(state: LobbyState): void;
  onEnd(state: LobbyState): void;
  onPlayerDisconnect?(sessionId: string, state: LobbyState): void;
}
```

Active mini-games include:
1. **Tapping Race**: Rapid tap frequency contest with Turbo card multipliers.
2. **Trivia**: 5-question general knowledge challenge with lockout penalties for wrong answers.
3. **Math Problem**: Dynamic arithmetic equation solver with answer elimination.
4. **Hot Potato**: Random potato assignment with pass mechanics and explosive end timers.
5. **Lumber Cut**: Cooperative 2-player saw rhythm mechanics for 2v2 and solo cutting for BR.
6. **Rock Paper Scissors**: Simultaneous reveal match with animated shoot countdown and tiebreaker rounds.
7. **Cyclone**: Arcade timing challenge measuring distance from the bullseye.
8. **Balloon Inflate**: Risk-reward pumping mechanics with air leak decay and explosion thresholds.
9. **Simon Says**: Sequence memorization with progressive speed curves and elimination rules.
10. **Scrabble**: Anagram and word assembly validated against `an-array-of-english-words` (`^2.0.0`).
11. **Screen Painting**: Canvas coverage competition with real-time percentage thresholds.
12. **Perfection**: Drag-and-drop geometric shape matching against board cutouts.

### 3.4 Specialty Card Engine

The server implements game theory card mechanics awarded every 3 rounds or via underdog boosts:
- **Respin**: Forces the wheel to redraw category and mode.
- **Shield**: Protects the player from drinking penalties on loss.
- **Turbo**: Grants a 1.5x efficiency boost or bonus points in applicable games.
- **Double Points**: Multiplies round victory score from +3 to +6.
- **Wild Card**: Allows manual selection of the next mini-game and game mode.

---

## 4. Build, Distribution and DevOps

### 4.1 Client Build Pipeline

- **EAS Build (`eas.json`)**: Cloud build system configured with:
  - `development`: Development client build with internal distribution.
  - `preview`: Internal ad-hoc test build.
  - `production`: App Store and Google Play release profile with automatic version increments.
- **React Compiler**: Enabled via `experiments.reactCompiler` in `app.json` for automatic component memoization.
- **Custom Config Plugins**:
  - `./plugins/withDeferGestures`: Native iOS gesture deferral plugin preventing accidental edge navigation swipes during intense mini-game taps.
  - `scripts/patch-xcode-check.js`: Postinstall hook maintaining Xcode 16 compatibility.

### 4.2 Quality Assurance and Diagnostics

- **Expo Doctor**: Integrated health check suite verifying 18 critical configuration, package version, and module criteria (`npx expo-doctor`).
- **ESLint (`^9.25.0`)**: Configured with `eslint-config-expo` (`~58.0.4`).
- **TypeScript Strict Checking**: Both client and server maintain 0 compile-time errors with `tsc --noEmit`.

---

## 5. Technology Summary Matrix

| Domain | Technology | Version | Location |
| :--- | :--- | :--- | :--- |
| Mobile Platform | Expo SDK | `~58.0.20` | `fizzbuzz/package.json` |
| Mobile Framework | React Native | `0.88.0` | `fizzbuzz/package.json` |
| UI Framework | React | `19.3.0` | `fizzbuzz/package.json` |
| File Router | Expo Router | `~58.0.27` | `fizzbuzz/package.json` |
| Styling | NativeWind / Tailwind CSS | `^4.2.6` / `^3.3.2` | `fizzbuzz/package.json` |
| 2D Graphics Canvas | React Native Skia | `2.14.0` | `fizzbuzz/package.json` |
| Animation Engine | Reanimated | `4.7.1` | `fizzbuzz/package.json` |
| Gesture Engine | Gesture Handler | `~3.3.0` | `fizzbuzz/package.json` |
| Audio Engine | Expo Audio | `~58.0.10` | `fizzbuzz/package.json` |
| Client State | Redux Toolkit | `^2.11.2` | `fizzbuzz/package.json` |
| Client Multiplayer | Colyseus JS SDK | `^0.16.22` / `^0.17.35` | `fizzbuzz/package.json` |
| Server Runtime | Node.js | `>= 20.0.0` | `fizzbuzz-server/package.json` |
| Server Multiplayer | Colyseus Core | `^0.17.39` | `fizzbuzz-server/package.json` |
| State Serialization | Colyseus Schema | `^4.0.26` | `fizzbuzz-server/package.json` |
| Server Transport | Colyseus WS Transport | `^0.17.11` | `fizzbuzz-server/package.json` |
| HTTP Server | Express | `^5.2.1` | `fizzbuzz-server/package.json` |
| Word Dictionary | an-array-of-english-words | `^2.0.0` | `fizzbuzz-server/package.json` |
| Client Language | TypeScript | `~6.0.3` | `fizzbuzz/package.json` |
| Server Language | TypeScript | `^6.0.2` | `fizzbuzz-server/package.json` |
| Cloud Build | EAS CLI | `>= 20.0.0` | `fizzbuzz/eas.json` |
