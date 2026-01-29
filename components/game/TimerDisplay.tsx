import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { TimerState } from "./types";

type TimerDisplayProps = {
  timerState: TimerState;
  isComplete?: boolean;
};

// Pre-load all digit images to avoid dynamic requires
const DIGIT_IMAGES = {
  "0": require("@/assets/images/numbers/no_0.png"),
  "1": require("@/assets/images/numbers/no_1.png"),
  "2": require("@/assets/images/numbers/no_2.png"),
  "3": require("@/assets/images/numbers/no_3.png"),
  "4": require("@/assets/images/numbers/no_4.png"),
  "5": require("@/assets/images/numbers/no_5.png"),
  "6": require("@/assets/images/numbers/no_6.png"),
  "7": require("@/assets/images/numbers/no_7.png"),
  "8": require("@/assets/images/numbers/no_8.png"),
  "9": require("@/assets/images/numbers/no_9.png"),
  ":": require("@/assets/images/numbers/colon.png"),
} as const;

type DigitChar = keyof typeof DIGIT_IMAGES;

// Memoized component to prevent re-renders when digit doesn't change
const PixelDigit = React.memo(({ char }: { char: DigitChar }) => {
  return (
    <Image
      source={DIGIT_IMAGES[char]}
      style={styles.digitImage}
      resizeMode="contain"
    />
  );
});

export const TimerDisplay = ({
  timerState,
  isComplete = false,
}: TimerDisplayProps) => {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Flash animation when level is complete
  useEffect(() => {
    if (isComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      opacityAnim.setValue(1);
    }
  }, [isComplete, opacityAnim]);
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const seconds = totalSeconds % 60;
    const cs = Math.floor((milliseconds % 1000) / 10); // Centiseconds (0-99)

    // Format: SS:CS (2 digits for each)
    return `${seconds.toString().padStart(2, "0")}:${cs.toString().padStart(2, "0")}`;
  };

  // Memoize the digit array to avoid recreating on every render
  const formattedTime = formatTime(timerState.elapsedTime);
  const digitChars = useMemo(() => {
    return formattedTime.split("") as DigitChar[];
  }, [formattedTime]);

  // Only show timer if it has started
  if (!timerState.startTime) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <View style={styles.timerContainer}>
        {digitChars.map((char, index) => (
          <PixelDigit key={index} char={char} />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0, // No gap between digits for tight pixel art look
  },
  digitImage: {
    width: 20,
    height: 30,
  },
});
