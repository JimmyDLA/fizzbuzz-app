export type SpecialtyCardType =
  | "turbo"
  | "shield"
  | "double_points"
  | "respin"
  | "wild_card";

export type SpecialtyCardRarityLevel = 1 | 2 | 3;

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
    rarity: 2,
    rarityLabel: "RARE",
    colorClass: "bg-cyan-400",
    darkColorClass: "bg-cyan-500",
    hexColor: "#00E5FF",
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
    rarityLabel: "COMMON",
    colorClass: "bg-pink-400",
    darkColorClass: "bg-pink-500",
    hexColor: "#FF4081",
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
    rarityLabel: "RARE",
    colorClass: "bg-amber-400",
    darkColorClass: "bg-yellow-500",
    hexColor: "#A855F7",
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
    rarity: 3,
    rarityLabel: "COMMON",
    colorClass: "bg-lime-400",
    darkColorClass: "bg-lime-500",
    hexColor: "#76FF03",
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
    rarityLabel: "EPIC",
    colorClass: "bg-purple-500",
    darkColorClass: "bg-purple-600",
    hexColor: "#FFC107",
    iconName: "cards-playing-outline",
    iconFamily: "MaterialCommunityIcons",
    description: "HAND-PICK THE NEXT MINIGAME AND PLAYERS",
    phaseText: "Match Setup Phase",
    activationHint:
      "Activate during Wheel Phase to hand-pick the minigame, game type, and players.",
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
