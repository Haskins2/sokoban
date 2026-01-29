import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { TimerState } from "./types";

type TimerDisplayProps = {
  timerState: TimerState;
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

export const TimerDisplay = ({ timerState }: TimerDisplayProps) => {
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const cs = Math.floor((milliseconds % 1000) / 10); // Centiseconds (0-99)

    // Format: MM:SS:CS (2 digits for centiseconds)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${cs.toString().padStart(2, "0")}`;
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
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        {digitChars.map((char, index) => (
          <PixelDigit key={index} char={char} />
        ))}
      </View>
    </View>
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
