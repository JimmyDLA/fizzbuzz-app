import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

interface RetroInputProps extends TextInputProps {
  className?: string;
}

export function RetroInput({
  style,
  className = "",
  placeholderTextColor = "rgba(0,0,0,0.3)",
  ...props
}: RetroInputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      className={`bg-white rounded-2xl px-4 py-3 text-3xl font-black text-center text-black mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${className}`}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 3,
    borderColor: "#000000",
  },
});
