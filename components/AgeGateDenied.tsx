import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AgeGateDeniedProps {
  onPlayPartyMode: () => void;
  onRetry: () => void;
}

export function AgeGateDenied({
  onPlayPartyMode,
  onRetry,
}: AgeGateDeniedProps) {
  return (
    <View className="w-full max-w-sm items-center">
      <View style={{ width: "100%", position: "relative" }}>
        {/* Shadow Layer */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 24, top: 8, left: 8 },
          ]}
          className="bg-black"
        />

        {/* Card Face */}
        <View
          style={{
            borderRadius: 24,
            borderWidth: 4,
            borderColor: "#000000",
            padding: 24,
            backgroundColor: "#fee2e2",
            alignItems: "center",
          }}
        >
          <Text className="text-6xl mb-4 font-black">🛑</Text>

          <Text className="text-3xl font-black text-red-600 text-center mb-2 uppercase tracking-tight">
            ACCESS DENIED
          </Text>

          <Text className="text-center font-bold text-black/80 mb-6 text-sm">
            You must be 21 or older to enter Drinking Mode. Try our
            high-energy Party Mode instead!
          </Text>

          {/* Action Buttons */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={onPlayPartyMode}
            className="w-full mb-3"
          >
            <View style={{ height: 56, position: "relative" }}>
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 16, top: 3, left: 3 },
                ]}
                className="bg-black"
              />
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    borderRadius: 16,
                    borderWidth: 3,
                    borderColor: "#000000",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                className="bg-cyan-300"
              >
                <Text className="text-base font-black text-black">
                  PLAY PARTY MODE →
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            onPress={onRetry}
            className="w-full"
          >
            <View style={{ height: 56, position: "relative" }}>
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 16, top: 3, left: 3 },
                ]}
                className="bg-black"
              />
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    borderRadius: 16,
                    borderWidth: 3,
                    borderColor: "#000000",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                className="bg-white"
              >
                <Text className="text-base font-black text-black">
                  TRY ANOTHER YEAR
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
