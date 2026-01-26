import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { UserMenu } from "@/components/UserMenu";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <UserMenu />
      <Text style={styles.title}>Sokoban</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => router.push("/main")}
          style={styles.playButton}
        >
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
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    marginBottom: 60,
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
