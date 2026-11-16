import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { getCardConfig, SpecialtyCardType } from "../constants/specialtyCards";
import { colyseusService } from "../store/colyseusService";
import { setCardError } from "../store/lobbySlice";
import { selectRoundIsBetting } from "../store/selectors";
import { RootState } from "../store/store";
import {
  EARNED_THIS_ROUND_MESSAGE,
  hasUsableCopy,
  isCardLockedThisRound,
  readEarnedRounds,
  USABLE_NEXT_ROUND_HINT,
} from "../utils/cardRound";
import { holderDrinksToPass, passDrinkPhrase } from "../utils/shieldPass";
import { playButtonClickSound } from "../utils/sound";
import { RetroButton } from "./RetroButton";
import { SpecialtyCard } from "./SpecialtyCard";

const ALL_CATEGORIES = [
  "Tapping Race",
  "Math Problem",
  "Hot Potato",
  "Lumber Cut",
  "Trivia",
  "Rock Paper Scissors",
  "Cyclone",
  "Balloon Inflate",
  "Simon Says",
  "Scrabble",
  "Screen Painting",
  "Perfection",
];

const EXCLUDED_2V2_CATEGORIES = [
  "Rock Paper Scissors",
  "Simon Says",
  "Perfection",
  "Hot Potato",
];

const EXCLUDED_TURBO_GAMES = [
  "Hot Potato",
  "Rock Paper Scissors",
  "Simon Says",
];

const GAME_TYPES = ["1v1", "2v2", "BR"];

export function CardDock() {
  const {
    players,
    playerName,
    gamePhase,
    selectedPlayers,
    currentCategory,
    lastLosers,
    drinkChains,
    pendingCardAward,
    roundCount,
  } = useSelector((state: RootState) => state.lobby);
  const isBettingRound = useSelector(selectRoundIsBetting);
  const dispatch = useDispatch();

  const myPlayer = players.find((p: any) => p.name === playerName);
  const myCards: string[] = myPlayer?.cards || [];
  const earnedRounds = readEarnedRounds(myPlayer?.earnedRounds);

  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null,
  );
  const [trackedHandLength, setTrackedHandLength] = useState(myCards.length);
  if (trackedHandLength !== myCards.length) {
    setTrackedHandLength(myCards.length);
    if (selectedCardIndex != null && selectedCardIndex >= myCards.length) {
      setSelectedCardIndex(null);
    }
  }
  const [showWildModal, setShowWildModal] = useState(false);
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES[0]);
  const [selectedType, setSelectedType] = useState("1v1");
  const [selectedWildPlayers, setSelectedWildPlayers] = useState<string[]>([]);
  const [activeAccordion, setActiveAccordion] = useState<
    "type" | "category" | "players"
  >("type");

  if (!myPlayer) return null;

  const selectedCardId =
    selectedCardIndex != null ? myCards[selectedCardIndex] : undefined;

  const notifyEarnedThisRound = (cardId: string) => {
    dispatch(
      setCardError({
        cardId,
        code: "earned_this_round",
        message: EARNED_THIS_ROUND_MESSAGE,
      }),
    );
  };

  const cardIsLocked = (index: number) =>
    isCardLockedThisRound(earnedRounds, index, gamePhase, roundCount);

  // Hand Overflow Prompt (Max 2 cards) - only show when no pending card award popup is open
  const isOverflow = myCards.length > 2 && !pendingCardAward;
  const drinksToPass = holderDrinksToPass(myPlayer.id, drinkChains, lastLosers);

  const handleUseCard = (cardId: string, index: number) => {
    playButtonClickSound();
    if (cardIsLocked(index)) {
      notifyEarnedThisRound(cardId);
      setSelectedCardIndex(null);
      return;
    }
    const cardKey = cardId.toLowerCase().replace(/\s+/g, "_");

    if (cardKey === "wild_card" || cardKey === "wildcard") {
      if (isBettingRound) {
        setSelectedType("BR");
        setSelectedWildPlayers(players.map((p) => p.id));
        setActiveAccordion("category");
      } else {
        const defaultPlayers = players.map((p) => p.id).slice(0, 2);
        setSelectedWildPlayers(defaultPlayers);
        setSelectedType("1v1");
        setActiveAccordion("type");
      }
      setSelectedCategory(ALL_CATEGORIES[0]);
      setSelectedCardIndex(null);
      setShowWildModal(true);
      return;
    }

    if (cardKey === "shield") {
      const amILoser = lastLosers.includes(myPlayer.id);
      if (!amILoser && gamePhase === "resolution") {
        return;
      }
      setSelectedCardIndex(null);
      setShowShieldModal(true);
      return;
    }

    // Direct activation for TURBO, DOUBLE POINTS, RESPIN
    colyseusService.useCard(cardId);
    setSelectedCardIndex(null);
  };

  const handleSelectType = (type: string) => {
    playButtonClickSound();
    setSelectedType(type);

    // If 2v2 selected and current category is invalid for 2v2, reset category
    if (type === "2v2" && EXCLUDED_2V2_CATEGORIES.includes(selectedCategory)) {
      setSelectedCategory("Tapping Race");
    }

    // Adjust selected players count to match required type
    if (type === "1v1") {
      setSelectedWildPlayers(players.map((p) => p.id).slice(0, 2));
    } else if (type === "2v2") {
      setSelectedWildPlayers(players.map((p) => p.id).slice(0, 4));
    } else {
      setSelectedWildPlayers(players.map((p) => p.id));
    }
  };

  const handleSelectCategory = (cat: string) => {
    playButtonClickSound();
    setSelectedCategory(cat);
  };

  const toggleWildPlayerSelect = (playerId: string) => {
    playButtonClickSound();
    if (selectedType === "1v1") {
      if (selectedWildPlayers.includes(playerId)) {
        setSelectedWildPlayers(
          selectedWildPlayers.filter((id) => id !== playerId),
        );
      } else {
        if (selectedWildPlayers.length < 2) {
          setSelectedWildPlayers([...selectedWildPlayers, playerId]);
        } else {
          // Replace second player
          setSelectedWildPlayers([selectedWildPlayers[0], playerId]);
        }
      }
    } else if (selectedType === "2v2") {
      if (selectedWildPlayers.includes(playerId)) {
        setSelectedWildPlayers(
          selectedWildPlayers.filter((id) => id !== playerId),
        );
      } else {
        if (selectedWildPlayers.length < 4) {
          setSelectedWildPlayers([...selectedWildPlayers, playerId]);
        }
      }
    } else {
      // BR
      if (selectedWildPlayers.includes(playerId)) {
        setSelectedWildPlayers(
          selectedWildPlayers.filter((id) => id !== playerId),
        );
      } else {
        setSelectedWildPlayers([...selectedWildPlayers, playerId]);
      }
    }
  };

  const isWildPlayerCountValid = (): boolean => {
    if (isBettingRound) return players.length >= 2;
    if (selectedType === "1v1") return selectedWildPlayers.length === 2;
    if (selectedType === "2v2") return selectedWildPlayers.length === 4;
    return selectedWildPlayers.length >= 2;
  };

  const handleConfirmWildCard = () => {
    if (!isWildPlayerCountValid()) return;
    playButtonClickSound();
    if (
      !hasUsableCopy(myCards, earnedRounds, "wild_card", gamePhase, roundCount)
    ) {
      notifyEarnedThisRound("WILD CARD");
      setShowWildModal(false);
      return;
    }
    colyseusService.useCard("WILD CARD", {
      category: selectedCategory,
      type: isBettingRound ? "BR" : selectedType,
      selectedPlayers: isBettingRound
        ? players.map((p) => p.id)
        : selectedWildPlayers,
    });
    setShowWildModal(false);
    setSelectedCardIndex(null);
  };

  const handleConfirmShield = (targetPlayerId: string) => {
    playButtonClickSound();
    if (!hasUsableCopy(myCards, earnedRounds, "shield", gamePhase, roundCount)) {
      notifyEarnedThisRound("SHIELD");
      setShowShieldModal(false);
      return;
    }
    colyseusService.useCard("SHIELD", { targetPlayerId });
    setShowShieldModal(false);
    setSelectedCardIndex(null);
  };

  const handleDiscard = (cardIndex: number) => {
    playButtonClickSound();
    colyseusService.discardCard(cardIndex);
    setSelectedCardIndex(null);
  };

  const checkCardStatus = (
    cardId: string,
    index: number,
  ): { playable: boolean; locked: boolean; reason?: string } => {
    if (cardIsLocked(index)) {
      return { playable: false, locked: true, reason: USABLE_NEXT_ROUND_HINT };
    }

    const norm = cardId.toLowerCase().replace(/\s+/g, "_");

    if (
      gamePhase !== "wheel" &&
      gamePhase !== "chart" &&
      gamePhase !== "resolution"
    ) {
      return {
        playable: false,
        locked: false,
        reason: "Cards cannot be used right now",
      };
    }

    if (norm === "respin" || norm === "wild_card") {
      if (gamePhase === "wheel" || gamePhase === "chart") {
        return { playable: true, locked: false };
      }
      return {
        playable: false,
        locked: false,
        reason: "Play it on the chart or after the wheel lands, before the countdown",
      };
    }

    if (norm === "turbo") {
      if (gamePhase !== "wheel" && gamePhase !== "chart") {
        return {
          playable: false,
          locked: false,
          reason: "Only playable during Wheel Phase",
        };
      }
      if (!selectedPlayers.includes(myPlayer.id)) {
        return {
          playable: false,
          locked: false,
          reason: "You are not participating in this minigame",
        };
      }
      if (EXCLUDED_TURBO_GAMES.includes(currentCategory)) {
        return {
          playable: false,
          locked: false,
          reason: "Turbo cannot be used for this minigame",
        };
      }
      return { playable: true, locked: false };
    }

    if (norm === "double_points") {
      if (gamePhase !== "wheel" && gamePhase !== "chart") {
        return {
          playable: false,
          locked: false,
          reason: "Only playable during Wheel Phase",
        };
      }
      if (!selectedPlayers.includes(myPlayer.id)) {
        return {
          playable: false,
          locked: false,
          reason: "You are not participating in this minigame",
        };
      }
      return { playable: true, locked: false };
    }

    if (norm === "shield") {
      if (gamePhase === "resolution" && lastLosers.includes(myPlayer.id)) {
        return { playable: true, locked: false };
      }
      return {
        playable: false,
        locked: false,
        reason: "Only playable when receiving a drink penalty",
      };
    }

    return { playable: false, locked: false };
  };

  const selectedStatus =
    selectedCardId != null && selectedCardIndex != null
      ? checkCardStatus(selectedCardId, selectedCardIndex)
      : null;

  const availableCategories =
    selectedType === "2v2"
      ? ALL_CATEGORIES.filter((cat) => !EXCLUDED_2V2_CATEGORIES.includes(cat))
      : ALL_CATEGORIES;

  return (
    <>
      {/* Hand dock. Resolution is included so a card dealt this round is visible while locked. */}
      {myCards.length > 0 &&
        (gamePhase === "chart" ||
          gamePhase === "wheel" ||
          gamePhase === "resolution") && (
          <View
            style={styles.dockContainer}
            className="flex-row items-center gap-2 px-3 py-2 rounded-full border-3 border-black bg-zinc-900/90 shadow-2xl z-[9000]"
          >
            <View className="flex-row items-center gap-1 pr-1 border-r border-zinc-700">
              <Ionicons name="sparkles" size={16} color="#A855F7" />
              <Text className="text-white font-black text-[10px] uppercase">
                {myCards.length}/2
              </Text>
            </View>

            {myCards.slice(0, 2).map((cardId, index) => {
              const config = getCardConfig(cardId);
              const status = checkCardStatus(cardId, index);
              const chipColor = `border-2 border-black ${config.colorClass}`;

              if (status.locked) {
                return (
                  <View
                    key={`${cardId}-${index}`}
                    accessibilityState={{ disabled: true }}
                    className={`items-center px-3 py-1 rounded-2xl ${chipColor}`}
                    style={{ opacity: 0.45 }}
                  >
                    <Text className="font-black text-black text-xs uppercase tracking-wider">
                      {config.name}
                    </Text>
                    <Text className="font-black text-black text-[8px] uppercase tracking-wide">
                      {USABLE_NEXT_ROUND_HINT}
                    </Text>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={`${cardId}-${index}`}
                  onPress={() => {
                    playButtonClickSound();
                    setSelectedCardIndex(index);
                  }}
                  className={`flex-row items-center px-3 py-1.5 rounded-full ${chipColor}`}
                  style={{
                    opacity: status.playable ? 1 : 0.6,
                    transform: [{ scale: status.playable ? 1.05 : 1 }],
                  }}
                >
                  <Text className="font-black text-black text-xs uppercase tracking-wider">
                    {config.name}
                  </Text>
                  {status.playable && (
                    <View className="w-2 h-2 rounded-full bg-white ml-1.5 animate-pulse" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      {/* Overflow Discard Modal (When > 2 cards) */}
      <Modal
        visible={isOverflow}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="w-full max-w-sm bg-zinc-900 border-4 border-amber-400 rounded-3xl p-6 items-center shadow-2xl">
            <Ionicons name="alert-circle" size={48} color="#F59E0B" />
            <Text className="text-white font-black text-xl uppercase tracking-wider text-center mt-2">
              HAND OVERFLOW
            </Text>
            <Text className="text-zinc-400 font-bold text-xs uppercase text-center mt-1 mb-4">
              Maximum 2 cards allowed. Discard 1 card to continue:
            </Text>

            <View className="w-full gap-3">
              {myCards.map((cardId, idx) => {
                const config = getCardConfig(cardId);
                const locked = cardIsLocked(idx);
                return (
                  <View
                    key={idx}
                    className="flex-row justify-between items-center bg-zinc-800 p-3 rounded-2xl border-2 border-black"
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`w-3 h-3 rounded-full ${config.colorClass}`}
                          style={{ opacity: locked ? 0.45 : 1 }}
                        />
                        <Text
                          className="text-white font-black text-sm uppercase"
                          style={{ opacity: locked ? 0.45 : 1 }}
                          numberOfLines={1}
                        >
                          {config.name}
                        </Text>
                      </View>
                      {locked && (
                        <Text className="text-amber-400 font-black text-[10px] uppercase mt-1 ml-5">
                          {USABLE_NEXT_ROUND_HINT}
                        </Text>
                      )}
                    </View>
                    <RetroButton
                      title="DISCARD"
                      variant="danger"
                      size="sm"
                      style={{ width: 110 }}
                      onPress={() => handleDiscard(idx)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Selected Card Action Modal */}
      {selectedCardId && selectedCardIndex != null && selectedStatus && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedCardIndex(null)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center p-6 z-[9999]">
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              onPress={() => setSelectedCardIndex(null)}
            />
            <View className="w-full max-w-sm items-center">
              <SpecialtyCard
                type={getCardConfig(selectedCardId).id as SpecialtyCardType}
                size="xl"
                isDisabled={selectedStatus.locked}
              />

              {/* When to Use Hint Box */}
              <View className="mt-3 bg-zinc-900 border-2 border-purple-500/60 px-4 py-2.5 rounded-2xl w-full">
                <Text className="text-purple-400 font-black text-[10px] tracking-widest uppercase text-center mb-0.5">
                  WHEN TO USE
                </Text>
                <Text className="text-zinc-300 font-bold text-xs text-center uppercase">
                  {getCardConfig(selectedCardId).activationHint}
                </Text>
              </View>

              {selectedStatus.reason && !selectedStatus.playable && (
                <View className="mt-3 bg-black/80 px-4 py-2 rounded-xl border border-zinc-700 w-full">
                  <Text className="text-amber-400 font-bold text-xs text-center uppercase">
                    {selectedStatus.reason}
                  </Text>
                </View>
              )}

              <View className="w-full flex-row justify-center mt-4 gap-2">
                {selectedStatus.playable && (
                  <RetroButton
                    title="ACTIVATE"
                    variant="success"
                    size="md"
                    onPress={() =>
                      handleUseCard(selectedCardId, selectedCardIndex)
                    }
                    style={{ flex: 1 }}
                  />
                )}
                <RetroButton
                  title="CLOSE"
                  variant="secondary"
                  size="md"
                  onPress={() => setSelectedCardIndex(null)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Wild Card Selector Modal with 3 Accordions */}
      <Modal
        visible={showWildModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowWildModal(false);
          setSelectedCardIndex(null);
        }}
      >
        <View className="flex-1 bg-black/90 justify-center items-center p-4">
          <View className="w-full max-w-md bg-zinc-900 border-4 border-purple-500 rounded-3xl p-5 max-h-[90%]">
            <Text className="text-purple-400 font-black text-2xl uppercase tracking-widest text-center mb-4">
              WILD CARD SELECTION
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="gap-3 mb-4"
            >
              {/* Accordion 1: Game Type */}
              <View className="border-2 border-zinc-700 rounded-2xl overflow-hidden bg-zinc-800/80">
                <TouchableOpacity
                  onPress={() => {
                    playButtonClickSound();
                    setActiveAccordion(
                      activeAccordion === "type" ? ("category" as any) : "type",
                    );
                  }}
                  className="flex-row justify-between items-center px-4 py-3 bg-zinc-800"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    1. GAME TYPE ({isBettingRound ? "BATTLE ROYALE" : selectedType})
                  </Text>
                  <Ionicons
                    name={
                      activeAccordion === "type" ? "chevron-up" : "chevron-down"
                    }
                    size={18}
                    color="#ffffff"
                  />
                </TouchableOpacity>

                {activeAccordion === "type" && isBettingRound && (
                  <View className="p-3">
                    <View className="bg-amber-400 border-2 border-black rounded-xl py-2.5 items-center">
                      <Text className="text-black font-black text-xs uppercase">
                        Battle Royale
                      </Text>
                    </View>
                    <Text className="text-amber-200 font-bold text-[11px] text-center mt-2 uppercase">
                      You can change the game. The mode stays Battle Royale.
                    </Text>
                  </View>
                )}

                {activeAccordion === "type" && !isBettingRound && (
                  <View className="p-3 flex-row gap-2">
                    {GAME_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => handleSelectType(t)}
                        className={`flex-1 py-2.5 rounded-xl border-2 border-black items-center ${selectedType === t ? "bg-amber-400" : "bg-zinc-700"}`}
                      >
                        <Text className="text-black font-black text-xs uppercase">
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Accordion 2: Game Category */}
              <View className="border-2 border-zinc-700 rounded-2xl overflow-hidden bg-zinc-800/80">
                <TouchableOpacity
                  onPress={() => {
                    playButtonClickSound();
                    setActiveAccordion(
                      activeAccordion === "category"
                        ? ("players" as any)
                        : "category",
                    );
                  }}
                  className="flex-row justify-between items-center px-4 py-3 bg-zinc-800"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    2. CATEGORY ({selectedCategory})
                  </Text>
                  <Ionicons
                    name={
                      activeAccordion === "category"
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={18}
                    color="#ffffff"
                  />
                </TouchableOpacity>

                {activeAccordion === "category" && (
                  <View className="p-3 flex-row flex-wrap gap-2">
                    {availableCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => handleSelectCategory(cat)}
                        className={`px-3 py-2 rounded-xl border-2 border-black ${selectedCategory === cat ? "bg-purple-500" : "bg-zinc-700"}`}
                      >
                        <Text className="text-white font-black text-xs uppercase">
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Accordion 3: Player Selection */}
              <View className="border-2 border-zinc-700 rounded-2xl overflow-hidden bg-zinc-800/80">
                <TouchableOpacity
                  onPress={() => {
                    playButtonClickSound();
                    setActiveAccordion(
                      activeAccordion === "players"
                        ? ("type" as any)
                        : "players",
                    );
                  }}
                  className="flex-row justify-between items-center px-4 py-3 bg-zinc-800"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    3. PLAYERS (
                    {isBettingRound
                      ? "EVERYONE"
                      : `${selectedWildPlayers.length}/${
                          selectedType === "1v1" ? 2 : selectedType === "2v2" ? 4 : "min 2"
                        }`}
                    )
                  </Text>
                  <Ionicons
                    name={
                      activeAccordion === "players"
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={18}
                    color="#ffffff"
                  />
                </TouchableOpacity>

                {activeAccordion === "players" && isBettingRound && (
                  <View className="p-3">
                    <Text className="text-amber-200 font-bold text-[11px] text-center uppercase">
                      Every player is in. The mode stays Battle Royale.
                    </Text>
                  </View>
                )}

                {activeAccordion === "players" && !isBettingRound && (
                  <View className="p-3 flex-row flex-wrap gap-2">
                    {players.map((p) => {
                      const isSelected = selectedWildPlayers.includes(p.id);
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => toggleWildPlayerSelect(p.id)}
                          className={`px-3 py-2 rounded-xl border-2 border-black ${isSelected ? "bg-emerald-400" : "bg-zinc-700"}`}
                        >
                          <Text className="text-black font-black text-xs uppercase">
                            {p.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="flex-row justify-between gap-3">
              <RetroButton
                title="CANCEL"
                variant="danger"
                size="md"
                onPress={() => {
                  setShowWildModal(false);
                  setSelectedCardIndex(null);
                }}
                style={{ flex: 1 }}
              />
              <RetroButton
                title="LOCK IN GAME"
                variant="success"
                size="md"
                disabled={!isWildPlayerCountValid()}
                onPress={handleConfirmWildCard}
                style={{ flex: 1, opacity: isWildPlayerCountValid() ? 1 : 0.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Shield Target Picker Modal */}
      <Modal
        visible={showShieldModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowShieldModal(false);
          setSelectedCardIndex(null);
        }}
      >
        <View className="flex-1 bg-black/90 justify-center items-center p-6">
          <View className="w-full max-w-sm bg-zinc-900 border-4 border-pink-500 rounded-3xl p-6 items-center">
            <Ionicons name="shield-checkmark" size={48} color="#EC4899" />
            <Text className="text-pink-400 font-black text-xl uppercase tracking-wider text-center mt-2 mb-1">
              SHIELD ACTIVATED
            </Text>
            <Text className="text-zinc-400 font-bold text-xs uppercase text-center mb-4">
              Select a player to receive your drink penalty:
            </Text>

            <View className="w-full gap-2 mb-6">
              {players
                .filter((p) => p.id !== myPlayer.id)
                .map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleConfirmShield(p.id)}
                    className="w-full bg-pink-500/20 border-2 border-pink-500 py-3 rounded-2xl items-center"
                  >
                    <Text className="text-pink-300 font-black text-sm uppercase">
                      PASS {passDrinkPhrase(drinksToPass)} TO {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            <RetroButton
              title="CANCEL"
              variant="secondary"
              size="md"
              onPress={() => {
                setShowShieldModal(false);
                setSelectedCardIndex(null);
              }}
              style={{ width: "100%" }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
    zIndex: 9999,
  },
});
