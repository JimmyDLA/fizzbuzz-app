import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  setAgeVerified,
  setGameMode,
  toggleMusic,
  toggleTheme,
} from "../store/lobbySlice";
import { RootState } from "../store/store";
import {
  playButtonClickSound,
  startBackgroundMusic,
  stopBackgroundMusic,
} from "../utils/sound";

interface SettingsDropdownProps {
  style?: any;
  isHomeScreen?: boolean;
}

export function SettingsDropdown({
  style,
  isHomeScreen = false,
}: SettingsDropdownProps) {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const { theme, isMusicOn, gameMode, ageVerified } = useSelector(
    (state: RootState) => state.lobby,
  );
  const isDark = theme === "dark";

  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playButtonClickSound();
    dispatch(toggleTheme());
  };

  const handleToggleMusic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playButtonClickSound();
    if (isMusicOn) {
      stopBackgroundMusic();
    } else {
      startBackgroundMusic();
    }
    dispatch(toggleMusic());
  };

  const handleToggleGameMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playButtonClickSound();
    setIsOpen(false);
    dispatch(setGameMode(null));
    dispatch(setAgeVerified(false));
  };

  return (
    <View style={style}>
      {/* Main Settings Gear Trigger Button */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          playButtonClickSound();
          setIsOpen(!isOpen);
        }}
        activeOpacity={0.8}
        style={{ width: 44, height: 44, position: "relative" }}
      >
        {/* Shadow */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 16, top: 3, left: 3 },
          ]}
          className={isDark ? "bg-white" : "bg-black"}
        />
        {/* Button Surface */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: 16,
              borderWidth: 3,
              borderColor: isDark ? "#ffffff" : "#000000",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
          className={isDark ? "bg-zinc-800" : "bg-white"}
        >
          <Ionicons
            name="settings-sharp"
            size={20}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </View>
      </TouchableOpacity>

      {/* Floating Dropdown Modal Menu */}
      {isOpen && (
        <Modal transparent visible animationType="fade">
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setIsOpen(false)}
          >
            {/* Backdrop */}
            <View className="flex-1 bg-black/30" />
          </Pressable>

          {/* Floating Card positioned near top-right */}
          <View
            style={{
              position: "absolute",
              top: 102,
              right: 24,
              width: 240,
              zIndex: 9999,
            }}
          >
            {/* Behind Shadow */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { borderRadius: 20, top: 5, left: 5 },
              ]}
              className={isDark ? "bg-white" : "bg-black"}
            />

            {/* Menu Container */}
            <View
              style={{
                borderRadius: 20,
                borderWidth: 3.5,
                borderColor: isDark ? "#ffffff" : "#000000",
                padding: 8,
              }}
              className={isDark ? "bg-zinc-900" : "bg-amber-50"}
            >
              {/* Option 1: Dark Mode Toggle */}
              <TouchableOpacity
                onPress={handleToggleTheme}
                activeOpacity={0.7}
                style={{
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: isDark ? "#ffffff" : "#000000",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                className={isDark ? "bg-zinc-800" : "bg-white"}
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="w-7 h-7 rounded-lg bg-yellow-400 border border-black items-center justify-center">
                    <Ionicons
                      name={isDark ? "moon" : "sunny"}
                      size={16}
                      color="#000000"
                    />
                  </View>
                  <Text
                    className={`font-black text-xs uppercase ${isDark ? "text-white" : "text-black"}`}
                  >
                    {isDark ? "Dark Mode" : "Light Mode"}
                  </Text>
                </View>
                <View
                  className={`px-2 py-0.5 rounded-md border ${
                    isDark
                      ? "bg-purple-500 border-white"
                      : "bg-amber-300 border-black"
                  }`}
                >
                  <Text className="font-black text-[10px] text-black uppercase">
                    {isDark ? "DARK" : "LIGHT"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Background Music Toggle */}
              <TouchableOpacity
                onPress={handleToggleMusic}
                activeOpacity={0.7}
                style={{
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: isDark ? "#ffffff" : "#000000",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                className={isDark ? "bg-zinc-800" : "bg-white"}
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="w-7 h-7 rounded-lg bg-cyan-400 border border-black items-center justify-center">
                    <Ionicons
                      name={isMusicOn ? "musical-notes" : "volume-mute"}
                      size={16}
                      color="#000000"
                    />
                  </View>
                  <Text
                    className={`font-black text-xs uppercase ${isDark ? "text-white" : "text-black"}`}
                  >
                    Music
                  </Text>
                </View>
                <View
                  className={`px-2 py-0.5 rounded-md border ${
                    isMusicOn
                      ? "bg-emerald-400 border-black"
                      : "bg-rose-400 border-black"
                  }`}
                >
                  <Text className="font-black text-[10px] text-black uppercase">
                    {isMusicOn ? "ON" : "OFF"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Party / Drinking Mode Toggle */}
              {isHomeScreen && (
                <TouchableOpacity
                  onPress={handleToggleGameMode}
                  activeOpacity={0.7}
                  style={{
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: isDark ? "#ffffff" : "#000000",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  className={isDark ? "bg-zinc-800" : "bg-white"}
                >
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-7 h-7 rounded-lg bg-pink-400 border border-black items-center justify-center">
                      <MaterialCommunityIcons
                        name={gameMode === "drinking" ? "beer" : "party-popper"}
                        size={16}
                        color="#000000"
                      />
                    </View>
                    <Text
                      className={`font-black text-xs uppercase ${isDark ? "text-white" : "text-black"}`}
                    >
                      {gameMode === "drinking" ? "Drinking Mode" : "Party Mode"}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-0.5 rounded-md border ${
                      gameMode === "drinking"
                        ? "bg-amber-400 border-black"
                        : "bg-cyan-300 border-black"
                    }`}
                  >
                    <Text className="font-black text-[10px] text-black uppercase">
                      {gameMode === "drinking" ? "21+" : "ALL"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
