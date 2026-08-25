import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  SPECIALTY_CARDS,
  SpecialtyCardType,
} from "../constants/specialtyCards";
import { playButtonClickSound } from "../utils/sound";
import { RetroButton } from "./RetroButton";
import { SpecialtyCard } from "./SpecialtyCard";

export interface SpecialtyCardData {
  id: string;
  name: string;
  subtitle?: string;
  rarity?: string;
  activationPhase?: string;
  description?: string;
  iconName?: any;
}

export type SpecialtyCard = SpecialtyCardData;

export const FINAL_SPECIALTY_CARDS: SpecialtyCardData[] = Object.values(
  SPECIALTY_CARDS,
).map((c) => ({
  id: c.id,
  name: c.name,
  subtitle: c.phaseText,
  rarity: c.rarityLabel,
  activationPhase: c.phaseText,
  description: c.description,
  iconName: c.iconName,
}));

export function SpecialtyCardModal({
  visible,
  card,
  onClose,
  onDrawNew,
}: {
  visible: boolean;
  card: SpecialtyCardData | null;
  onClose: () => void;
  onDrawNew: () => void;
}) {
  if (!visible || !card) return null;

  const handleClose = () => {
    playButtonClickSound();
    onClose();
  };

  const handleDrawNew = () => {
    playButtonClickSound();
    onDrawNew();
  };

  // Map card id to official SpecialtyCardType
  const cardType: SpecialtyCardType = (
    ["turbo", "shield", "double_points", "respin", "wild_card"].includes(
      card.id,
    )
      ? card.id
      : "shield"
  ) as SpecialtyCardType;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Dark Backdrop Overlay */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View className="flex-1 bg-black/80" />
        </TouchableOpacity>

        {/* Hero Specialty Playing Card & Modal Actions */}
        <View className="items-center justify-center z-10 w-full px-6">
          <View style={{ position: "relative" }}>
            {/* The Neo-Brutalist Playing Card */}
            <SpecialtyCard type={cardType} size="xl" />

            {/* Floating Top-Right Close Button */}
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.8}
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                zIndex: 20,
                width: 38,
                height: 38,
                borderRadius: 19,
                borderWidth: 3.5,
                borderColor: "#000000",
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000000",
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 6,
              }}
            >
              <Ionicons name="close" size={22} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons underneath Card */}
          <View className="w-[255px] gap-3 mt-6">
            <RetroButton
              title="DRAW ANOTHER"
              variant="secondary"
              onPress={handleDrawNew}
            />
            <RetroButton
              title="CLAIM CARD"
              variant="success"
              onPress={handleClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
