export type SpecialtyCardType =
  | "turbo"
  | "shield"
  | "double_points"
  | "respin"
  | "wild_card";

/**
 * 1 Legendary (rarest) through 4 Common.
 * Last place receives the lowest number, matching the server sort.
 */
export type SpecialtyCardRarityLevel = 1 | 2 | 3 | 4;

/** Rarity-tag colors. These are not the card art colors. */
export const RARITY_TAGS: Record<
  SpecialtyCardRarityLevel,
  { label: string; hex: string; textHex: string }
> = {
  1: { label: "LEGENDARY", hex: "#FACC15", textHex: "#111111" },
  2: { label: "EPIC", hex: "#A855F7", textHex: "#FFFFFF" },
  3: { label: "RARE", hex: "#2563EB", textHex: "#FFFFFF" },
  4: { label: "COMMON", hex: "#22C55E", textHex: "#111111" },
};

export interface SpecialtyCardConfig {
  id: SpecialtyCardType;
  name: string;
  displayTitle: string;
  rarity: SpecialtyCardRarityLevel;
  rarityLabel: string;
  colorClass: string;
  darkColorClass: string;
  hexColor: string;
  iconName: string;
  iconFamily: "MaterialCommunityIcons" | "Ionicons" | "FontAwesome5";
  description: string;
  phaseText: string;
  activationHint: string;
}

export const SPECIALTY_CARDS: Record<SpecialtyCardType, SpecialtyCardConfig> = {
  turbo: {
    id: "turbo",
    name: "TURBO",
    displayTitle: "TURBO",
    rarity: 3,
    rarityLabel: RARITY_TAGS[3].label,
    colorClass: "bg-[#02D9EE]",
    darkColorClass: "bg-[#019CAB]",
    hexColor: "#02D9EE",
    iconName: "flash",
    iconFamily: "MaterialCommunityIcons",
    description: "ALL INPUTS AND SCORES IN NEXT MINIGAME COUNT 1.5X",
    phaseText: "Next Minigame Phase",
    activationHint: "Activate before a minigame starts if you are playing.",
  },
  shield: {
    id: "shield",
    name: "SHIELD",
    displayTitle: "SHIELD",
    rarity: 3,
    rarityLabel: RARITY_TAGS[3].label,
    colorClass: "bg-[#FE559D]",
    darkColorClass: "bg-[#B73D71]",
    hexColor: "#FE559D",
    iconName: "shield",
    iconFamily: "MaterialCommunityIcons",
    description: "NEGATE YOUR DRINK PENALTY AND PASS IT TO ANOTHER PLAYER",
    phaseText: "Resolution Phase",
    activationHint: "Activate when receiving a drink penalty.",
  },
  double_points: {
    id: "double_points",
    name: "DOUBLE POINTS",
    displayTitle: "DOUBLE\nPOINTS",
    rarity: 2,
    rarityLabel: RARITY_TAGS[2].label,
    colorClass: "bg-[#F7C133]",
    darkColorClass: "bg-[#B28B25]",
    hexColor: "#F7C133",
    iconName: "star",
    iconFamily: "MaterialCommunityIcons",
    description: "DOUBLES YOUR EARNED SCORE POINTS (2X) IF YOU WIN NEXT GAME",
    phaseText: "Next Minigame Phase",
    activationHint: "Activate before a minigame starts if you are playing.",
  },
  respin: {
    id: "respin",
    name: "RESPIN",
    displayTitle: "RESPIN",
    rarity: 4,
    rarityLabel: RARITY_TAGS[4].label,
    colorClass: "bg-[#C6FB2D]",
    darkColorClass: "bg-[#8FB520]",
    hexColor: "#C6FB2D",
    iconName: "refresh",
    iconFamily: "MaterialCommunityIcons",
    description: "SKIP CURRENT WHEEL SELECTION AND FORCE A RESPIN",
    phaseText: "Wheel Selection Phase",
    activationHint:
      "Activate during wheel spin to re-spin the wheel for a new minigame.",
  },
  wild_card: {
    id: "wild_card",
    name: "WILD CARD",
    displayTitle: "WILD\nCARD",
    rarity: 1,
    rarityLabel: RARITY_TAGS[1].label,
    colorClass: "bg-[#AE48FC]",
    darkColorClass: "bg-[#7D34B5]",
    hexColor: "#AE48FC",
    iconName: "cards-playing-outline",
    iconFamily: "MaterialCommunityIcons",
    description: "HAND-PICK THE NEXT MINIGAME, GAME MODE, AND PLAYERS",
    phaseText: "Match Setup Phase",
    activationHint:
      "Play it on the chart, or after the wheel lands, until the countdown starts.",
  },
};

export function getCardConfig(cardId: string): SpecialtyCardConfig {
  if (!cardId) return SPECIALTY_CARDS.respin;
  const norm = cardId.toLowerCase().replace(/\s+/g, "_");
  if (norm === "turbo") return SPECIALTY_CARDS.turbo;
  if (norm === "shield") return SPECIALTY_CARDS.shield;
  if (norm === "double_points" || norm === "doublepoints")
    return SPECIALTY_CARDS.double_points;
  if (norm === "respin") return SPECIALTY_CARDS.respin;
  if (norm === "wild_card" || norm === "wildcard")
    return SPECIALTY_CARDS.wild_card;
  return SPECIALTY_CARDS.respin;
}
