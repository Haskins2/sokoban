import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

// Mock user data - will be replaced with Firebase auth
const MOCK_USER = {
  username: "Player1",
  email: "player@example.com",
  profilePicture: null,
  levelsCompleted: 5,
};

export function UserMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  const handleProfileClick = () => {
    setMenuVisible(false);
    router.push("/profile");
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={styles.userButton}
      >
        <MaterialIcons name="account-circle" size={32} color="white" />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.userInfo}>
              <MaterialIcons name="account-circle" size={60} color="#4CAF50" />
              <Text style={styles.username}>{MOCK_USER.username}</Text>
              <Text style={styles.email}>{MOCK_USER.email}</Text>
              <Text style={styles.stats}>
                Levels Completed: {MOCK_USER.levelsCompleted}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfileClick}
            >
              <MaterialIcons name="person" size={20} color="white" />
              <Text style={styles.profileButtonText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  userButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 30,
    minWidth: 280,
    alignItems: "center",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  username: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  email: {
    color: "#888",
    fontSize: 14,
    marginTop: 5,
  },
  stats: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 10,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  profileButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    color: "#888",
    fontSize: 14,
  },
});
