import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { LevelConfig } from "./types";
import { scale, moderateScale, spacing } from "@/constants/responsive";

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

const STAR_IMAGE = require("@/assets/images/stars/star_full.png");

const PixelDigit = React.memo(({ char }: { char: DigitChar }) => {
  return (
    <Image
      source={DIGIT_IMAGES[char]}
      style={styles.digitImage}
      resizeMode="contain"
    />
  );
});

PixelDigit.displayName = "PixelDigit";

type Props = {
  thresholds?: LevelConfig["starThresholds"];
  isVisible: boolean;
};

export const StarThresholdsDisplay = ({ thresholds, isVisible }: Props) => {
  if (!isVisible || !thresholds) return null;

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const seconds = totalSeconds % 60;
    const cs = Math.floor((milliseconds % 1000) / 10);
    return `${seconds.toString().padStart(2, "0")}:${cs.toString().padStart(2, "0")}`;
  };

  const renderRow = (starCount: number, time: number) => {
    const formatted = formatTime(time);
    const chars = formatted.split("") as DigitChar[];

    return (
      <View style={styles.row} key={starCount}>
        <View style={styles.starsContainer}>
          {Array.from({ length: starCount }).map((_, i) => (
            <Image
              key={i}
              source={STAR_IMAGE}
              style={styles.starIcon}
              resizeMode="contain"
            />
          ))}
        </View>
        <View style={styles.timeContainer}>
          {chars.map((char, index) => (
            <PixelDigit key={index} char={char} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderRow(1, thresholds[1])}
      {renderRow(2, thresholds[2])}
      {renderRow(3, thresholds[3])}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: scale(80),
    left: spacing.lg,
    zIndex: 900,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    width: scale(60), // Fixed width to align times. 3 stars * 20px = 60px
    alignItems: "center",
  },
  starIcon: {
    width: moderateScale(20, 0.3),
    height: moderateScale(20, 0.3),
  },
  timeContainer: {
    flexDirection: "row",
    marginLeft: spacing.sm,
  },
  digitImage: {
    width: moderateScale(16, 0.3),
    height: moderateScale(24, 0.3),
  },
});
