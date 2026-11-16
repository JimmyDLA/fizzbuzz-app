import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

interface RetroInputProps extends TextInputProps {
  className?: string;
}

export function RetroInput({
  style,
  className = "",
  placeholderTextColor,
  ...props
}: RetroInputProps) {
  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const defaultPlaceholderColor = isDark
    ? "rgba(255,255,255,0.4)"
    : "rgba(0,0,0,0.3)";

  return (
    <TextInput
      style={[
        styles.input,
        { borderColor: isDark ? "#ffffff" : "#000000" },
        style,
      ]}
      className={`${isDark ? "bg-zinc-800 text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]" : "bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"} rounded-2xl px-4 py-3 text-3xl font-black text-center mb-6 ${className}`}
      placeholderTextColor={placeholderTextColor || defaultPlaceholderColor}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 3,
  },
});
