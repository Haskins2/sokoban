import { useUserProgress } from "@/contexts/UserProgressContext";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { db } from "../firebaseConfig";

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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerIcon: {
    width: 30,
    height: 40,
  },
  logo: {
    width: 350,
    height: 60,
    marginTop: 10,
    marginBottom: 200,
  },
  buttonContainer: {
    gap: 20,
    alignItems: "center",
  },
  startButton: {
    width: 350,
    height: 60,
  },
  chapterSelectButton: {
    width: 350,
    height: 60,
  },
});
