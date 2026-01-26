import { UserMenu } from "@/components/UserMenu";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
        source={require("../assets/images/app_logo_large.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handlePlayClick} style={styles.playButton}>
          <View style={styles.buttonContent}>
            <MaterialIcons name="play-arrow" size={24} color="white" />
            <Text style={styles.playButtonText}>Play</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/level_select")}
          style={styles.menuButton}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons name="list" size={20} color="white" />
            <Text style={styles.menuButtonText}>Level Select</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/level_editor")}
          style={styles.menuButton}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.menuButtonText}>Level Editor</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
  },
  logo: {
    width: 1000,
    height: 400,
    marginBottom: -40,
  },
  buttonContainer: {
    gap: 20,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  playButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: 200,
  },
  playButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  menuButton: {
    backgroundColor: "#333",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
  },
  menuButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
