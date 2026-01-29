import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { scale, spacing, fontSize as responsiveFontSize } from "@/constants/responsive";

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
    top: spacing.xl,
    left: spacing.xl,
    padding: spacing.md,
    zIndex: 10,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: scale(80),
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: scale(40),
  },
  profileImage: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
  },
  username: {
    fontSize: responsiveFontSize.xxxl,
    fontWeight: "bold",
    color: "white",
    marginTop: spacing.lg,
  },
  email: {
    fontSize: responsiveFontSize.base,
    color: "#888",
    marginTop: spacing.sm,
  },
  section: {
    width: "100%",
    maxWidth: scale(500),
    backgroundColor: "#2a2a2a",
    borderRadius: scale(12),
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.xl,
    fontWeight: "bold",
    color: "white",
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  infoLabel: {
    color: "#ccc",
    fontSize: responsiveFontSize.base,
    flex: 1,
  },
  infoValue: {
    color: "white",
    fontSize: responsiveFontSize.base,
    fontWeight: "bold",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#333",
    padding: spacing.lg,
    borderRadius: scale(8),
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    color: "white",
    fontSize: responsiveFontSize.base,
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
    fontSize: responsiveFontSize.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  loginButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: scale(8),
  },
  loginButtonText: {
    color: "white",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
  },
});
