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
<!-- 5. Rank players into an object of 3 categories array (eg.:):
    ```js
    const rankedPlayerCat = {
      top: [
        player1,
        player2,
      ],
      mid: [
        player3,
        player4,
      ],
      bot: [
        player5,
        player6
      ],
    };
    ``` -->

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

1. 🎰 **Wheel Phase**:
   - **RESPIN 🔄**: Activated while the wheel is spinning or right after a category is selected. Overrides the current category and forces a re-spin.
   - **WILD CARD 🃏**: Activated before or during the wheel spin. Opens a selection modal allowing the card holder to pick the category and select participating players.
   - **TURBO ⚡**: Activated during the 5-second countdown. Multiplies all progress/score earned in that minigame by **1.5x**.
   - **DOUBLE POINTS 🌟**: Activated during countdown. If the player wins the round, their earned score points are doubled (**2x**).

2. 🍻 **Resolution Phase**:
   - **SHIELD 🛡️**: Activated when the Beer Modal pops up after losing a minigame. Negates the drink penalty and opens a target picker to redirect the drink to any player in the lobby!

---

## 🎨 UI & UX Integration Plan

1. **Player Card Dock (HUD)**:
   - A clean, floating card dock at the bottom of the screen displaying the player's current hand (up to 2 cards).
   - Tapping a card shows a quick detail card popover with an **"ACTIVATE CARD"** button.

2. **Server State Sync (`Colyseus` State)**:
   - Extend `Player` schema in `LobbyState.ts` to include `cards: ArraySchema<string>()`.
   - Add server messages: `useCard`, `awardCard`, `discardCard`.
