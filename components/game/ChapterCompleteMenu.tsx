import { moderateScale, scale, spacing } from "@/constants/responsive";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebaseConfig";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

const STAR_FULL = require("@/assets/images/stars/star_full.png");
const STAR_EMPTY = require("@/assets/images/stars/star_empty.png");
const LEADERBOARD_TITLE = require("@/assets/images/leaderboard/leaderboard.png");
const PLAY_AGAIN_BUTTON = require("@/assets/images/leaderboard/play_again.png");
const CONTINUE_BUTTON = require("@/assets/images/leaderboard/continue.png");

type LeaderboardEntry = {
  rank: number;
  odUserId: string;
  username: string;
  time: number;
  isCurrentUser: boolean;
};

type ChapterCompleteMenuProps = {
  visible: boolean;
  levelNumber: number;
  chapterNumber?: number;
  achievedTime: number;
  starsEarned: number;
  starThresholds?: { 1: number; 2: number; 3: number };
  onPlayAgain: () => void;
  onContinue: () => void;
};

const PixelDigit = React.memo(
  ({
    char,
    size = "normal",
  }: {
    char: DigitChar;
    size?: "normal" | "small";
  }) => {
    const style = size === "small" ? styles.digitImageSmall : styles.digitImage;
    return (
      <Image source={DIGIT_IMAGES[char]} style={style} resizeMode="contain" />
    );
  },
);

PixelDigit.displayName = "PixelDigit";

const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const seconds = totalSeconds % 60;
  const cs = Math.floor((milliseconds % 1000) / 10);
  return `${seconds.toString().padStart(2, "0")}:${cs.toString().padStart(2, "0")}`;
};

const TimeDisplay = ({
  time,
  size = "normal",
}: {
  time: number;
  size?: "normal" | "small";
}) => {
  const formatted = formatTime(time);
  const chars = formatted.split("") as DigitChar[];
  return (
    <View style={styles.timeRow}>
      {chars.map((char, index) => (
        <PixelDigit key={index} char={char} size={size} />
      ))}
    </View>
  );
};

const StarsDisplay = ({ earned }: { earned: number }) => {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3].map((star) => (
        <Image
          key={star}
          source={star <= earned ? STAR_FULL : STAR_EMPTY}
          style={styles.starIcon}
          resizeMode="contain"
        />
      ))}
    </View>
  );
};

const ThresholdRow = ({
  starCount,
  time,
}: {
  starCount: number;
  time: number;
}) => {
  return (
    <View style={styles.thresholdRow}>
      <View style={styles.thresholdStars}>
        {Array.from({ length: starCount }).map((_, i) => (
          <Image
            key={i}
            source={STAR_FULL}
            style={styles.thresholdStarIcon}
            resizeMode="contain"
          />
        ))}
      </View>
      <TimeDisplay time={time} size="small" />
    </View>
  );
};

const LeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
  return (
    <View
      style={[
        styles.leaderboardItem,
        item.isCurrentUser && styles.leaderboardItemHighlight,
      ]}
    >
      <Text
        style={[styles.rankText, item.isCurrentUser && styles.highlightText]}
      >
        {item.rank}
      </Text>
      <Text
        style={[
          styles.usernameText,
          item.isCurrentUser && styles.highlightText,
        ]}
        numberOfLines={1}
      >
        {item.username}
      </Text>
      <View style={styles.leaderboardTimeContainer}>
        <TimeDisplay time={item.time} size="small" />
      </View>
    </View>
  );
};

export const ChapterCompleteMenu = ({
  visible,
  levelNumber,
  achievedTime,
  starsEarned,
  starThresholds,
  onPlayAgain,
  onContinue,
}: ChapterCompleteMenuProps) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const levelId = `level_${levelNumber}`;
        const usersRef = collection(db, "speedRuns", levelId, "users");
        const q = query(usersRef, orderBy("time", "asc"), limit(150));
        const snapshot = await getDocs(q);

        let userFoundInTop150 = false;
        const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
          const isCurrentUser = user ? doc.id === user.uid : false;
          if (isCurrentUser) {
            userFoundInTop150 = true;
            setUserRank(index + 1);
          }
          return {
            rank: index + 1,
            odUserId: doc.id,
            username: doc.data().username || "Anonymous",
            time: doc.data().time,
            isCurrentUser,
          };
        });

        setLeaderboard(entries);

        // If user not in top 150, calculate their rank
        if (user && !userFoundInTop150) {
          const countQuery = query(usersRef, where("time", "<", achievedTime));
          const countSnapshot = await getCountFromServer(countQuery);
          setUserRank(countSnapshot.data().count + 1);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [visible, levelNumber, user, achievedTime]);

  // Scroll to user's position when leaderboard loads
  useEffect(() => {
    if (loading || leaderboard.length === 0) return;

    const userIndex = leaderboard.findIndex((entry) => entry.isCurrentUser);
    if (userIndex > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: Math.max(0, userIndex - 2),
          animated: true,
        });
      }, 500);
    }
  }, [loading, leaderboard]);

  if (!visible) return null;

  const userNotInTop150 = user && userRank && userRank > 150;

  return (
    <View style={styles.overlay}>
      <View style={styles.menuContainer}>
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Left Quarter - Achieved Time + Stars */}
          <View style={styles.leftQuarter}>
            <TimeDisplay time={achievedTime} />
            <StarsDisplay earned={starsEarned} />
          </View>

          {/* Right Quarter - Star Thresholds */}
          <View style={styles.rightQuarter}>
            {starThresholds &&
              (() => {
                // Sort thresholds: fastest (smallest) = 3 stars, slowest (largest) = 1 star
                const sortedTimes = Object.values(starThresholds)
                  .map(Number)
                  .filter((val) => val > 0)
                  .sort((a, b) => a - b);

                return (
                  <>
                    {sortedTimes[0] && (
                      <ThresholdRow starCount={3} time={sortedTimes[0]} />
                    )}
                    {sortedTimes[1] && (
                      <ThresholdRow starCount={2} time={sortedTimes[1]} />
                    )}
                    {sortedTimes[2] && (
                      <ThresholdRow starCount={1} time={sortedTimes[2]} />
                    )}
                  </>
                );
              })()}
          </View>
        </View>

        {/* Bottom Section - Leaderboard */}
        <View style={styles.bottomSection}>
          <Image
            source={LEADERBOARD_TITLE}
            style={styles.leaderboardTitle}
            resizeMode="contain"
          />

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#fff"
              style={styles.loader}
            />
          ) : leaderboard.length === 0 ? (
            <Text style={styles.emptyText}>Be the first!</Text>
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={leaderboard}
                keyExtractor={(item) => item.odUserId}
                renderItem={({ item }) => <LeaderboardItem item={item} />}
                style={styles.leaderboardList}
                showsVerticalScrollIndicator={false}
                onScrollToIndexFailed={(info) => {
                  setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                    });
                  }, 100);
                }}
              />

              {/* Show user's rank if outside top 150 */}
              {userNotInTop150 && (
                <View style={styles.userRankSection}>
                  <Text style={styles.userRankLabel}>Your rank:</Text>
                  <View
                    style={[
                      styles.leaderboardItem,
                      styles.leaderboardItemHighlight,
                    ]}
                  >
                    <Text style={[styles.rankText, styles.highlightText]}>
                      {userRank}
                    </Text>
                    <Text
                      style={[styles.usernameText, styles.highlightText]}
                      numberOfLines={1}
                    >
                      {user?.displayName || "You"}
                    </Text>
                    <View style={styles.leaderboardTimeContainer}>
                      <TimeDisplay time={achievedTime} size="small" />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onPlayAgain} style={styles.button}>
              <Image
                source={PLAY_AGAIN_BUTTON}
                style={styles.buttonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onContinue} style={styles.button}>
              <Image
                source={CONTINUE_BUTTON}
                style={styles.buttonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  menuContainer: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: "#1a1a2e",
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: "#4a4a6a",
    padding: spacing.lg,
    overflow: "hidden",
  },
  topSection: {
    flexDirection: "row",
    height: scale(120),
    marginBottom: spacing.md,
  },
  leftQuarter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rightQuarter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: spacing.md,
  },
  bottomSection: {
    flex: 1,
    minHeight: scale(200),
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  digitImage: {
    width: moderateScale(24, 0.3),
    height: moderateScale(36, 0.3),
  },
  digitImageSmall: {
    width: moderateScale(14, 0.3),
    height: moderateScale(21, 0.3),
  },
  starsRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  starIcon: {
    width: moderateScale(28, 0.3),
    height: moderateScale(28, 0.3),
  },
  thresholdRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  thresholdStars: {
    flexDirection: "row",
    width: scale(50),
  },
  thresholdStarIcon: {
    width: moderateScale(14, 0.3),
    height: moderateScale(14, 0.3),
  },
  leaderboardTitle: {
    width: scale(180),
    height: scale(40),
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  leaderboardList: {
    flex: 1,
    maxHeight: scale(200),
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: scale(4),
    marginVertical: 2,
  },
  leaderboardItemHighlight: {
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    borderWidth: 1,
    borderColor: "#ffd700",
  },
  rankText: {
    color: "#fff",
    fontSize: moderateScale(14),
    width: scale(35),
    fontWeight: "bold",
  },
  usernameText: {
    color: "#fff",
    fontSize: moderateScale(14),
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  highlightText: {
    color: "#ffd700",
  },
  leaderboardTimeContainer: {
    minWidth: scale(60),
    alignItems: "flex-end",
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyText: {
    color: "#888",
    fontSize: moderateScale(16),
    textAlign: "center",
    marginVertical: spacing.xl,
  },
  userRankSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#4a4a6a",
  },
  userRankLabel: {
    color: "#888",
    fontSize: moderateScale(12),
    marginBottom: spacing.xs,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#4a4a6a",
  },
  button: {
    padding: spacing.xs,
  },
  buttonImage: {
    width: scale(120),
    height: scale(40),
  },
});
