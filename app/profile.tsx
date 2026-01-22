import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

// Mock user data - will be replaced with Firebase auth
const MOCK_USER = {
  username: "Player1",
  email: "player@example.com",
  profilePicture: null,
  joinDate: "January 2026",
  levelsCompleted: 5,
  totalLevels: 10,
  bestTime: "3:45",
  totalPlayTime: "2h 30m",
};

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <MaterialIcons name="arrow-back" size={32} color="white" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialIcons name="account-circle" size={120} color="#4CAF50" />
          <Text style={styles.username}>{MOCK_USER.username}</Text>
          <Text style={styles.email}>{MOCK_USER.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={20} color="#888" />
            <Text style={styles.infoLabel}>Member Since:</Text>
            <Text style={styles.infoValue}>{MOCK_USER.joinDate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>

          <View style={styles.infoRow}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.infoLabel}>Levels Completed:</Text>
            <Text style={styles.infoValue}>
              {MOCK_USER.levelsCompleted} / {MOCK_USER.totalLevels}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="timer" size={20} color="#888" />
            <Text style={styles.infoLabel}>Best Time:</Text>
            <Text style={styles.infoValue}>{MOCK_USER.bestTime}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="access-time" size={20} color="#888" />
            <Text style={styles.infoLabel}>Total Play Time:</Text>
            <Text style={styles.infoValue}>{MOCK_USER.totalPlayTime}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="settings" size={20} color="white" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]}>
            <MaterialIcons name="logout" size={20} color="white" />
            <Text style={styles.actionButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 80,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  username: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginTop: 15,
  },
  email: {
    fontSize: 16,
    color: "#888",
    marginTop: 5,
  },
  section: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  infoLabel: {
    color: "#ccc",
    fontSize: 16,
    flex: 1,
  },
  infoValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#d32f2f",
  },
});
