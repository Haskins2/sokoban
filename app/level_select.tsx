import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { LevelConfig } from "@/components/game/types";
import { MaterialIcons } from "@expo/vector-icons";

export default function LevelSelect() {
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const q = query(collection(db, "levels"), orderBy("levelNumber"));
      const querySnapshot = await getDocs(q);
      const fetchedLevels = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLevels(fetchedLevels);
    } catch (error) {
      console.error("Error fetching levels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelSelect = (level: any) => {
    router.push({
      pathname: "/main",
      params: { levelData: JSON.stringify(level) },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/home")}
        style={styles.homeButton}
      >
        <MaterialIcons name="home" size={32} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Select Level</Text>
      <FlatList
        data={levels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.levelItem}
            onPress={() => handleLevelSelect(item)}
          >
            <Text style={styles.levelText}>Level {item.levelNumber}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
  },
  homeButton: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  levelItem: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
