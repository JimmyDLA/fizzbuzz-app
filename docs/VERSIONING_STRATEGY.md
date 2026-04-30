# Handling Client-Server Version Mismatches

In a live multiplayer environment like Fizzbuzz, the server (Node/Colyseus) can be deployed and updated instantly, while the frontend (React Native) is subject to App Store review times and the user's willingness to download updates. 

This creates a scenario where the **server is often ahead of the client**. This document outlines our strategy for handling version mismatches to prevent crashes and ensure a smooth user experience.

---

## 1. The Core Strategy: Version Handshaking
Every time the React Native client connects to the Colyseus server, it must send its current app version.

**Client-side:**
```typescript
// app/index.tsx or store/colyseusService.ts
import * as Application from 'expo-application';

const clientVersion = Application.nativeApplicationVersion || "1.0.0";
await colyseusService.connect({ version: clientVersion });
```

**Server-side:**
```typescript
// fizzbuzz-server/src/rooms/LobbyRoom.ts
onAuth(client: Client, options: any) {
  const minRequiredVersion = "1.2.0";
  
  if (isVersionOlder(options.version, minRequiredVersion)) {
    throw new ServerError(426, "Upgrade Required");
  }
  return true;
}
```

---

## 2. Hard Limits (Forced Updates)
When a **breaking change** occurs on the server (e.g., a massive overhaul to the `LobbyState` schema or core room flow), older clients will fatally crash if they try to interpret the new data.

**How to handle:**
1. Update the `minRequiredVersion` on the Colyseus server.
2. When the outdated client attempts to connect, the server throws a `426 Upgrade Required` error.
3. The React Native app catches this specific error in the `.catch()` block of the connection logic.
4. The app displays a full-screen **"Update Required"** modal with a button linking directly to the App Store/Google Play Store, preventing them from entering the broken game state.

---

## 3. Soft Limits (Graceful Degradation)
When the server adds **additive features** (like a brand new mini-game such as *Cyclone* or *Balloon Inflate*), we don't necessarily need to force everyone to update immediately. 

There are two ways to handle clients that don't have the new mini-game UI code:

### Approach A: The Generic Fallback (Recommended)
If an old client is in a lobby and the server randomly selects "Balloon Inflate", the old client won't have a `case "Balloon Inflate": return <BalloonInflateUI />` in their code. 

To prevent a crash, the frontend's `game.tsx` switch statement must have a robust `default` fallback:
```tsx
switch(currentGameCategory) {
  case "Cyclone": return <CycloneUI />;
  // ... older games
  default: 
    return (
      <View style={styles.fallbackContainer}>
         <Text>A new mini-game is being played!</Text>
         <Text>Update your app to join the fun. You will sit out this round.</Text>
      </View>
    );
}
```
*Result:* The older client spectates safely, while updated clients play the new game.

### Approach B: Server-Side Lowest Common Denominator
The server keeps track of every connected player's `appVersion`. When the `LobbyRoom` is picking a random game, it filters the game pool based on the oldest version present in the room.
*Result:* If Player 4 has an old app, the server temporarily disables "Balloon Inflate" from the randomizer so the whole group can continue playing together on older games.

---

## 4. Colyseus Schema Rules (CRITICAL)
Colyseus uses strict binary serialization for performance. If you change the Schema on the server, you must follow these rules to avoid destroying outdated clients:

❌ **NEVER remove or reorder existing `@type()` fields.**
❌ **NEVER change the data type of an existing field.** (e.g., changing `@type("number")` to `@type("string")`).

✅ **ALWAYS append new fields to the end of your schema classes.**
Old clients will simply ignore fields they don't know about, while new clients will read them perfectly.

### Why we use `gameData: string`
You may have noticed we heavily use `p.gameData = JSON.stringify(...)` for mini-games. This is a massive advantage for versioning! Because the schema strictly defines it as a `string`, the server can send totally new nested JSON structures for new games, and the binary schema serializer will never break. Old clients will just see a JSON string they don't understand, while new clients will parse it successfully.
