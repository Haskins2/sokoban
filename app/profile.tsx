import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/contexts/UserProgressContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { completedLevels } = useUserProgress();

  const handleLogout = async () => {
    await logout();
    router.replace("/home");
  };

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={32} color="white" />
        </TouchableOpacity>

        <View style={styles.notLoggedIn}>
          <MaterialIcons name="account-circle" size={80} color="#888" />
          <Text style={styles.notLoggedInText}>You're not logged in</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
          ) : (
            <MaterialIcons name="account-circle" size={120} color="#4CAF50" />
          )}
          <Text style={styles.username}>{user.displayName || "Player"}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Statistics</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="emoji-events" size={20} color="#FFD700" />
            <Text style={styles.infoLabel}>Levels Completed:</Text>
            <Text style={styles.infoValue}>{completedLevels.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="trending-up" size={20} color="#4CAF50" />
            <Text style={styles.infoLabel}>Next Level:</Text>
            <Text style={styles.infoValue}>
              {completedLevels.length > 0
                ? Math.max(...completedLevels) + 1
                : 1}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={20} color="#888" />
            <Text style={styles.infoLabel}>Member Since:</Text>
            <Text style={styles.infoValue}>
              {formatDate(user.metadata.creationTime)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="verified-user" size={20} color={user.emailVerified ? "#4CAF50" : "#888"} />
            <Text style={styles.infoLabel}>Email Verified:</Text>
            <Text style={styles.infoValue}>
              {user.emailVerified ? "Yes" : "No"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert("Coming Soon", "Edit profile feature is coming soon!")}
          >
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert("Coming Soon", "Settings feature is coming soon!")}
          >
            <MaterialIcons name="settings" size={20} color="white" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButtonStyle]}
            onPress={handleLogout}
          >
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
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  logoutButtonStyle: {
    backgroundColor: "#d32f2f",
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notLoggedInText: {
    color: "#888",
    fontSize: 18,
    marginTop: 20,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
