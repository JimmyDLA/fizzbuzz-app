# 🃏 FizzBuzz Specialty Cards Implementation & Design Spec

This document details the mechanics, game balance, player distribution triggers, and full implementation strategy for the **Specialty Cards** system in FizzBuzz.

![Specialty Cards](/assets/images/final_specialty_cards_exact_style_1785692862916.jpg)

---

## 🎴 Card Roster & Suit Theme

The 5 Specialty Cards follow a playing card suit aesthetic:

| Card Name         |  Color Theme  |  Rarity   | Activation Phase  | Ability Description                                                                   |
| :---------------- | :-----------: | :-------: | :---------------- | :------------------------------------------------------------------------------------ |
| **TURBO**         |    🩵 Cyan    |  Rare 🔵  | Pre-Minigame      | All inputs, taps, and score points in the next minigame count **1.5x**.               |
| **SHIELD**        |    🩷 Pink    | Common 🟢 | Beer / Resolution | Negates your drink penalty upon losing and passes it to a player of your choice.      |
| **DOUBLE POINTS** |    💛 Gold    |  Rare 🔵  | Pre-Minigame      | Doubles your earned score points (**2x**) if you win the next minigame.               |
| **RESPIN**        | 💚 Neon Green | Common 🟢 | Wheel Selection   | Skips the current wheel selection and forces an immediate wheel respin.               |
| **WILD CARD**     |   💜 Purple   |  Epic 🟣  | Match Setup       | Bypasses the wheel to hand-pick the next minigame category and participating players. |

---

## 🧠 Brainstorming: Distribution & Balance Mechanics

### 1. Which Players Get Specialty Cards(SC)?

1. Every 3 round SC are given out.
2. `totalPlayer ÷ 2 = totalSpecCards`(rounded down)
3. Generate `totalSpecCards` of SC based on the `rarity` property. The higher the number the more frequent it is generates it.
4. Sort all the SC by `rarity` (eg.: 1 = rarest, 3 = least rarest)
5. Rarest SC goes to the last player. The rest of the SC get randomized to the rest of the players.

---

### 2. When Are Specialty Cards Awarded?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CARD DROP TRIGGER EVENTS                          │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. Game Start: Each player is dealt 1 random starter card.              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 3. How Many Cards Can a Player Hold?

- **Hand Limit**: Maximum **2 cards** per player at any time.
- **Hand Overflow**: If a player earns a 3rd card while their hand is full:
  - They are prompted with a popup to **Discard 1 card**.

---

### 4. How & When Are Cards Played?

Cards are divided into **2 distinct activation windows** during the game flow:

#### Activation Window Details:

1. 🎰 **Wheel Phase** (Can active from the moment the wheel starts spinning until all players ready up. Once the count down starts, players can not access the SCs):
   - **RESPIN 🔄**: Overrides the current category and forces a re-spin. When a player uses this SC, all players (except player who activated it) should see this SC with the same pop animation used on CardAwardPopup but just the card, no buttons and it should say which player who used it. With a timeout of 3 seconds to dismiss it and afterwards re-run the spin the wheel for a new game.
   - **WILD CARD 🃏**: Opens a selection modal allowing the card holder to pick the type, category, and participating players. When a player uses this SC, all players (except player who activated it) should see this SC with the same pop animation used on CardAwardPopup but just the card, no buttons and it should say which player used it. With a setTimeout of 3 seconds to dismiss it. Player who activated this should be presented with a pop up with 3 accordions:
     - Game Type (select component)
     - Game Category (select component)
     - Player (select players) like the "dev override" selection in chart.tsx
   - **DOUBLE POINTS 🌟**: If the player wins the upcoming round, their earned score points are doubled (**2x**). When a player decided to activate this, on the count down screen, we should add a section for Double Points or Turbo and list all players who have activated it.
   - **TURBO ⚡**: Multiplies all progress/score earned in that mini game by **1.5x**. When a player decides to activate this, on the count down screen, we should add a section for Double Points or Turbo and list all players who have activated it. This SC card does exclude some games (Hot Potato, RPS, Simon Says)
     - Math Problem/Trivia: Gives you 1 extra point at the end
     - Cyclone: Slows down the speed of moving light 0.5 of current speed
     - Perfection: For every 4 pieces you match the game will match the next piece for you.
     - Screen Paint: The Stroke width will be 1.5x than the rest of the players
     - For the rest of the games: Multiplies all progress/score by 1.5x

2. 🍻 **Resolution Phase** (Can active from beer pop modal. Inside of the modal player should see a suggested button to use SC Shield, if available ):
   - **SHIELD 🛡️**: Negates the drink penalty and opens a target picker to redirect the drink to any player in the lobby! When a player uses this SC and confirms the player who should drink, all players (except player who activated it) should see this SC with the same pop animation used on CardAwardPopup but just the card, no buttons and it should say which player used it and the targeted player to drink.

---

## 🎨 UI & UX Integration Plan

1. **Player Card Dock (HUD)**:
   - A clean, floating card dock at the bottom of the screen displaying the player's current hand (up to 2 cards).
   - Tapping a card shows a quick detail card popover with an **"ACTIVATE CARD"** button.

2. **Server State Sync (`Colyseus` State)**:
   - Extend `Player` schema in `LobbyState.ts` to include `cards: ArraySchema<string>()`.
   - Add server messages: `useCard`, `awardCard`, `discardCard`.
