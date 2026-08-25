import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import {
  getCardConfig,
  SpecialtyCardType,
} from "../constants/specialtyCards";
import { colyseusService } from "../store/colyseusService";
import { RootState } from "../store/store";
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
  const { players, playerName, gamePhase, selectedPlayers, currentCategory, lastLosers } = useSelector(
    (state: RootState) => state.lobby,
  );
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const myPlayer = players.find((p: any) => p.name === playerName);
  const myCards: string[] = myPlayer?.cards || [];

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showWildModal, setShowWildModal] = useState(false);
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES[0]);
  const [selectedType, setSelectedType] = useState("1v1");
  const [selectedWildPlayers, setSelectedWildPlayers] = useState<string[]>([]);
  const [activeAccordion, setActiveAccordion] = useState<"type" | "category" | "players">("type");

  if (!myPlayer) return null;

  // Hand Overflow Prompt (Max 2 cards)
  const isOverflow = myCards.length > 2;

  const handleUseCard = (cardId: string) => {
    playButtonClickSound();
    const cardKey = cardId.toLowerCase().replace(/\s+/g, "_");

    if (cardKey === "wild_card" || cardKey === "wildcard") {
      // Default to first 2 players
      const defaultPlayers = players.map((p) => p.id).slice(0, 2);
      setSelectedWildPlayers(defaultPlayers);
      setSelectedType("1v1");
      setSelectedCategory(ALL_CATEGORIES[0]);
      setActiveAccordion("type");
      setShowWildModal(true);
      return;
    }

    if (cardKey === "shield") {
      const amILoser = lastLosers.includes(myPlayer.id);
      if (!amILoser && gamePhase === "resolution") {
        return;
      }
      setShowShieldModal(true);
      return;
    }

    // Direct activation for TURBO, DOUBLE POINTS, RESPIN
    colyseusService.useCard(cardId);
    setSelectedCardId(null);
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
        setSelectedWildPlayers(selectedWildPlayers.filter((id) => id !== playerId));
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
        setSelectedWildPlayers(selectedWildPlayers.filter((id) => id !== playerId));
      } else {
        if (selectedWildPlayers.length < 4) {
          setSelectedWildPlayers([...selectedWildPlayers, playerId]);
        }
      }
    } else {
      // BR
      if (selectedWildPlayers.includes(playerId)) {
        setSelectedWildPlayers(selectedWildPlayers.filter((id) => id !== playerId));
      } else {
        setSelectedWildPlayers([...selectedWildPlayers, playerId]);
      }
    }
  };

  const isWildPlayerCountValid = (): boolean => {
    if (selectedType === "1v1") return selectedWildPlayers.length === 2;
    if (selectedType === "2v2") return selectedWildPlayers.length === 4;
    return selectedWildPlayers.length >= 2;
  };

  const handleConfirmWildCard = () => {
    if (!isWildPlayerCountValid()) return;
    playButtonClickSound();
    colyseusService.useCard("WILD CARD", {
      category: selectedCategory,
      type: selectedType,
      selectedPlayers: selectedWildPlayers,
    });
    setShowWildModal(false);
    setSelectedCardId(null);
  };

  const handleConfirmShield = (targetPlayerId: string) => {
    playButtonClickSound();
    colyseusService.useCard("SHIELD", { targetPlayerId });
    setShowShieldModal(false);
    setSelectedCardId(null);
  };

  const handleDiscard = (cardIndex: number) => {
    playButtonClickSound();
    colyseusService.discardCard(cardIndex);
    setSelectedCardId(null);
  };

  const checkCardStatus = (cardId: string): { playable: boolean; reason?: string } => {
    const norm = cardId.toLowerCase().replace(/\s+/g, "_");

    if (gamePhase !== "wheel" && gamePhase !== "chart" && gamePhase !== "resolution") {
      return { playable: false, reason: "Cards cannot be used right now" };
    }

    if (norm === "respin" || norm === "wild_card") {
      if (gamePhase === "wheel" || gamePhase === "chart") {
        return { playable: true };
      }
      return { playable: false, reason: "Only playable during Wheel Phase" };
    }

    if (norm === "turbo") {
      if (gamePhase !== "wheel" && gamePhase !== "chart") {
        return { playable: false, reason: "Only playable during Wheel Phase" };
      }
      if (!selectedPlayers.includes(myPlayer.id)) {
        return { playable: false, reason: "You are not participating in this minigame" };
      }
      if (EXCLUDED_TURBO_GAMES.includes(currentCategory)) {
        return { playable: false, reason: "Turbo cannot be used for this minigame" };
      }
      return { playable: true };
    }

    if (norm === "double_points") {
      if (gamePhase !== "wheel" && gamePhase !== "chart") {
        return { playable: false, reason: "Only playable during Wheel Phase" };
      }
      if (!selectedPlayers.includes(myPlayer.id)) {
        return { playable: false, reason: "You are not participating in this minigame" };
      }
      return { playable: true };
    }

    if (norm === "shield") {
      if (gamePhase === "resolution" && lastLosers.includes(myPlayer.id)) {
        return { playable: true };
      }
      return { playable: false, reason: "Only playable when receiving a drink penalty" };
    }

    return { playable: false };
  };

  const availableCategories = selectedType === "2v2"
    ? ALL_CATEGORIES.filter((cat) => !EXCLUDED_2V2_CATEGORIES.includes(cat))
    : ALL_CATEGORIES;

  return (
    <>
      {/* Floating Bottom Card Dock */}
      {myCards.length > 0 && gamePhase !== "countdown" && gamePhase !== "playing" && (
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
            const status = checkCardStatus(cardId);

            return (
              <TouchableOpacity
                key={`${cardId}-${index}`}
                onPress={() => {
                  playButtonClickSound();
                  setSelectedCardId(cardId);
                }}
                className={`flex-row items-center px-3 py-1.5 rounded-full border-2 border-black ${config.colorClass}`}
                style={{
                  opacity: status.playable ? 1 : 0.6,
                  transform: [{ scale: status.playable ? 1.05 : 1 }],
                }}
              >
                <Text className="font-black text-black text-xs uppercase tracking-wider">
                  {config.name}
                </Text>
                {status.playable && (
                  <View className="w-2 h-2 rounded-full bg-white ml-1.5" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Overflow Discard Modal (When > 2 cards) */}
      <Modal visible={isOverflow} transparent animationType="fade">
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
                return (
                  <View
                    key={idx}
                    className="flex-row justify-between items-center bg-zinc-800 p-3 rounded-2xl border-2 border-black"
                  >
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`w-3 h-3 rounded-full ${config.colorClass}`}
                      />
                      <Text className="text-white font-black text-sm uppercase">
                        {config.name}
                      </Text>
                    </View>
                    <RetroButton
                      title="DISCARD"
                      variant="danger"
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
      {selectedCardId && (
        <Modal
          visible={!!selectedCardId}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedCardId(null)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center p-6 z-[9999]">
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              onPress={() => setSelectedCardId(null)}
            />
            <View className="w-full max-w-sm items-center">
              <SpecialtyCard
                type={getCardConfig(selectedCardId).id as SpecialtyCardType}
                size="lg"
              />

              {checkCardStatus(selectedCardId).reason && !checkCardStatus(selectedCardId).playable && (
                <View className="mt-4 bg-black/80 px-4 py-2 rounded-xl border border-zinc-700">
                  <Text className="text-amber-400 font-bold text-xs text-center uppercase">
                    {checkCardStatus(selectedCardId).reason}
                  </Text>
                </View>
              )}

              <View className="w-full flex-row justify-center mt-6 gap-2">
                {checkCardStatus(selectedCardId).playable && (
                  <RetroButton
                    title="ACTIVATE"
                    variant="success"
                    onPress={() => handleUseCard(selectedCardId)}
                    style={{ flex: 1 }}
                  />
                )}
                <RetroButton
                  title="CLOSE"
                  variant="secondary"
                  onPress={() => setSelectedCardId(null)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Wild Card Selector Modal with 3 Accordions */}
      <Modal visible={showWildModal} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-center items-center p-4">
          <View className="w-full max-w-md bg-zinc-900 border-4 border-purple-500 rounded-3xl p-5 max-h-[90%]">
            <Text className="text-purple-400 font-black text-2xl uppercase tracking-widest text-center mb-4">
              WILD CARD SELECTION
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} className="gap-3 mb-4">
              {/* Accordion 1: Game Type */}
              <View className="border-2 border-zinc-700 rounded-2xl overflow-hidden bg-zinc-800/80">
                <TouchableOpacity
                  onPress={() => {
                    playButtonClickSound();
                    setActiveAccordion(activeAccordion === "type" ? "type" : "type");
                  }}
                  className="flex-row justify-between items-center px-4 py-3 bg-zinc-800"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    1. GAME TYPE ({selectedType})
                  </Text>
                  <Ionicons
                    name={activeAccordion === "type" ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#ffffff"
                  />
                </TouchableOpacity>

                {activeAccordion === "type" && (
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
                    setActiveAccordion(activeAccordion === "category" ? "type" : "category");
                  }}
                  className="flex-row justify-between items-center px-4 py-3 bg-zinc-800"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    2. CATEGORY ({selectedCategory})
                  </Text>
                  <Ionicons
                    name={activeAccordion === "category" ? "chevron-up" : "chevron-down"}
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
                    setActiveAccordion(activeAccordion === "players" ? "type" : "players");
                  }}
                  className="flex-row justify-between items-center px-4 py-3 bg-zinc-800"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    3. PLAYERS ({selectedWildPlayers.length}/{selectedType === "1v1" ? 2 : selectedType === "2v2" ? 4 : `min 2`})
                  </Text>
                  <Ionicons
                    name={activeAccordion === "players" ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#ffffff"
                  />
                </TouchableOpacity>

                {activeAccordion === "players" && (
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
                onPress={() => setShowWildModal(false)}
                style={{ flex: 1 }}
              />
              <RetroButton
                title="LOCK IN GAME"
                variant="success"
                disabled={!isWildPlayerCountValid()}
                onPress={handleConfirmWildCard}
                style={{ flex: 1, opacity: isWildPlayerCountValid() ? 1 : 0.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Shield Target Picker Modal */}
      <Modal visible={showShieldModal} transparent animationType="slide">
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
                      PASS DRINK TO {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            <RetroButton
              title="CANCEL"
              variant="secondary"
              onPress={() => setShowShieldModal(false)}
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
    bottom: 24,
    alignSelf: "center",
  },
});
