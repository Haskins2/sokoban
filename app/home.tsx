import { useUserProgress } from "@/contexts/UserProgressContext";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { db } from "../firebaseConfig";
import { scale, spacing } from "@/constants/responsive";

export default function HomeScreen() {
  const router = useRouter();
  const { getNextIncompleteLevel } = useUserProgress();

  const handlePlayClick = async () => {
    const nextLevel = getNextIncompleteLevel();

    // Fetch the level data from Firestore
    try {
      const docRef = doc(db, "levels", `level_${nextLevel}`);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const levelData = { id: snap.id, ...snap.data() };
        router.push({
          pathname: "/main",
          params: { levelData: JSON.stringify(levelData) },
        });
      } else {
        // Fallback to main if level doesn't exist
        router.push("/main");
      }
    } catch (error) {
      console.error("Error fetching next level:", error);
      router.push("/main");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push("/home")}>
          <Image
            source={require("../assets/images/main_menu/home_icon.png")}
            style={styles.headerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Image
            source={require("../assets/images/main_menu/profile_icon.png")}
            style={styles.headerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <Image
        source={require("../assets/images/main_menu/main_title_long.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handlePlayClick}>
          <Image
            source={require("../assets/images/main_menu/start_text_design.png")}
            style={styles.startButton}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/chapter_select")}>
          <Image
            source={require("../assets/images/main_menu/chapter_select_text.png")}
            style={styles.chapterSelectButton}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  headerIcon: {
    width: scale(30),
    height: scale(40),
  },
  logo: {
    width: scale(350),
    height: scale(60),
    marginTop: spacing.sm,
    marginBottom: scale(200),
  },
  buttonContainer: {
    gap: spacing.xl,
    alignItems: "center",
  },
  startButton: {
    width: scale(350),
    height: scale(60),
  },
  chapterSelectButton: {
    width: scale(350),
    height: scale(60),
  },
});
