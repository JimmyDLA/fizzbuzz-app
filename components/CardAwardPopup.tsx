import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import type { SpecialtyCardType } from "../constants/specialtyCards";
import { getCardConfig } from "../constants/specialtyCards";
import { clearPendingCardAward } from "../store/lobbySlice";
import { RootState } from "../store/store";
import { playButtonClickSound } from "../utils/sound";
import { SpecialtyCard } from "./SpecialtyCard";

export function CardAwardPopup() {
  const dispatch = useDispatch();
  const pendingCardAward = useSelector(
    (state: RootState) => state.lobby.pendingCardAward,
  );

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardRotate = useRef(new Animated.Value(-15)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const badgeSlide = useRef(new Animated.Value(-60)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (pendingCardAward) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset all animations
      backdropOpacity.setValue(0);
      cardScale.setValue(0.3);
      cardRotate.setValue(-15);
      cardOpacity.setValue(0);
      badgeSlide.setValue(-60);
      badgeOpacity.setValue(0);
      buttonOpacity.setValue(0);
      shimmerX.setValue(-200);

      // Phase 1: Backdrop fades in
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Phase 2: Card slams in with bounce
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.spring(cardScale, {
            toValue: 1,
            tension: 90,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(cardRotate, {
            toValue: 0,
            tension: 90,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Phase 3: Shimmer sweep across card
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(shimmerX, {
          toValue: 500,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();

      // Phase 4: Badge slides in
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.spring(badgeSlide, {
            toValue: 0,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(badgeOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Phase 5: Glow pulse loop starts
      Animated.sequence([
        Animated.delay(800),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowPulse, {
              toValue: 1.04,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowPulse, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ),
      ]).start();

      // Phase 6: Button appears
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pendingCardAward]);

  const handleClaim = () => {
    playButtonClickSound();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Exit animation
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dispatch(clearPendingCardAward());
      glowPulse.stopAnimation();
    });
  };

  if (!pendingCardAward) return null;

  const config = getCardConfig(pendingCardAward.cardId);
  const cardRotateDeg = cardRotate.interpolate({
    inputRange: [-15, 0],
    outputRange: ["-15deg", "0deg"],
  });

  const isLastPlace = pendingCardAward.reason === "last_place";
  const isStarter = pendingCardAward.reason === "starter";

  const badgeBg = isLastPlace ? "#DC2626" : isStarter ? "#7C3AED" : "#065F46";
  const badgeText = isLastPlace
    ? "UNDERDOG BOOST"
    : isStarter
      ? "STARTER CARD"
      : "ROUND REWARD";

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClaim}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.container} pointerEvents="box-none">
        {/* Card with glow + entrance animation */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: cardOpacity,
              transform: [
                { scale: Animated.multiply(cardScale, glowPulse) },
                { rotate: cardRotateDeg },
              ],
            },
          ]}
        >
          {/* Colored glow halo */}
          <View
            style={[
              styles.glowHalo,
              {
                backgroundColor: config.hexColor + "55",
                shadowColor: config.hexColor,
              },
            ]}
          />

          <SpecialtyCard
            type={config.id as SpecialtyCardType}
            size="xl"
            showRarityBadge
          />

          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerX }, { rotate: "30deg" }] },
            ]}
            pointerEvents="none"
          />
        </Animated.View>

        {/* Claim button */}
        <Animated.View style={{ opacity: buttonOpacity, marginTop: 20 }}>
          <TouchableOpacity
            onPress={handleClaim}
            style={[styles.claimButton, { backgroundColor: config.hexColor }]}
            activeOpacity={0.85}
          >
            <Text style={styles.claimText}>ADD TO HAND</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClaim} style={styles.skipLink}>
            <Text style={styles.skipText}>tap anywhere to dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.88)",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 24,
  },
  headerBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
  },
  headerBadgeText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
  },
  cardWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowHalo: {
    position: "absolute",
    width: 310,
    height: 460,
    borderRadius: 36,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 30,
  },
  shimmer: {
    position: "absolute",
    top: 10,
    left: 0,
    width: 60,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 999,
  },
  subtitle: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  phaseHint: {
    color: "#a3a3a3",
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 4,
  },
  claimButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
    alignItems: "center",
  },
  claimText: {
    color: "#000000",
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  skipLink: {
    marginTop: 12,
    alignItems: "center",
  },
  skipText: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
