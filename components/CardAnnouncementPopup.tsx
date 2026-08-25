import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import type { SpecialtyCardType } from "../constants/specialtyCards";
import { getCardConfig } from "../constants/specialtyCards";
import { clearCardAnnouncement } from "../store/lobbySlice";
import { RootState } from "../store/store";
import { SpecialtyCard } from "./SpecialtyCard";

export function CardAnnouncementPopup() {
  const dispatch = useDispatch();
  const cardAnnouncement = useSelector(
    (state: RootState) => state.lobby.cardAnnouncement,
  );

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardRotate = useRef(new Animated.Value(-15)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const badgeSlide = useRef(new Animated.Value(-60)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (cardAnnouncement) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Reset animation values
      backdropOpacity.setValue(0);
      cardScale.setValue(0.3);
      cardRotate.setValue(-15);
      cardOpacity.setValue(0);
      badgeSlide.setValue(-60);
      badgeOpacity.setValue(0);
      shimmerX.setValue(-200);

      // Phase 1: Backdrop fade in
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Phase 2: Card bounce in
      Animated.sequence([
        Animated.delay(100),
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

      // Phase 3: Shimmer
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(shimmerX, {
          toValue: 500,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();

      // Phase 4: Badge slide in
      Animated.sequence([
        Animated.delay(400),
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

      // Phase 5: Glow pulse
      Animated.sequence([
        Animated.delay(600),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowPulse, {
              toValue: 1.04,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowPulse, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ),
      ]).start();

      // Auto dismiss after 3000ms
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(badgeOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          dispatch(clearCardAnnouncement());
          glowPulse.stopAnimation();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [cardAnnouncement, dispatch]);

  if (!cardAnnouncement) return null;

  const config = getCardConfig(cardAnnouncement.cardId);
  const cardRotateDeg = cardRotate.interpolate({
    inputRange: [-15, 0],
    outputRange: ["-15deg", "0deg"],
  });

  const isShield = config.id === "shield";
  const badgeTitle = isShield && cardAnnouncement.targetName
    ? `${cardAnnouncement.playerName} PASSED DRINK TO ${cardAnnouncement.targetName}`
    : `${cardAnnouncement.playerName} PLAYED ${config.name}`;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

      <View style={styles.container} pointerEvents="none">
        {/* Top Header Badge */}
        <Animated.View
          style={[
            styles.headerBadge,
            {
              backgroundColor: config.hexColor,
              opacity: badgeOpacity,
              transform: [{ translateY: badgeSlide }],
            },
          ]}
        >
          <Text style={styles.headerBadgeText}>{badgeTitle}</Text>
        </Animated.View>

        {/* Card Wrapper with Glow */}
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

          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerX }, { rotate: "30deg" }] },
            ]}
          />
        </Animated.View>

        {/* Action description text */}
        <Animated.View style={[styles.messageWrapper, { opacity: badgeOpacity }]}>
          <Text style={styles.messageText}>{cardAnnouncement.message}</Text>
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
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
    maxWidth: "90%",
  },
  headerBadgeText: {
    color: "#000000",
    fontWeight: "900",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
    top: 0,
    left: 0,
    width: 60,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 999,
  },
  messageWrapper: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  messageText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
