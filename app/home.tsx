import { UserMenu } from "@/components/UserMenu";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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
      <UserMenu />
      <Image
        source={require("../assets/images/app_logo_large_350.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handlePlayClick}>
          <Image
            source={require("../assets/images/START.png")}
            style={styles.startButton}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/level_select")}>
          <Image
            source={require("../assets/images/LEVEL_SELECT.png")}
            style={styles.levelSelectButton}
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
  logo: {
    width: 118 * 3.2,
    height: 49 * 3.3,
    marginTop: 100,
    marginBottom: 300,
  },
  buttonContainer: {
    gap: 20,
    alignItems: "center",
  },
  startButton: {
    width: 95 * 3.5,
    height: 23 * 3.5,
  },
  levelSelectButton: {
    width: 95 * 3.5,
    height: 22 * 3.5,
  },
});
