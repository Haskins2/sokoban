import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

export function UserMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleProfileClick = () => {
    setMenuVisible(false);
    router.push("/profile");
  };

  const handleLoginClick = () => {
    setMenuVisible(false);
    router.push("/login");
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={styles.userButton}
      >
        {user?.photoURL ? (
          <Image
            source={{ uri: user.photoURL }}
            style={styles.profileImage}
          />
        ) : (
          <MaterialIcons name="account-circle" size={32} color="white" />
        )}
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
            {user ? (
              <>
                <View style={styles.userInfo}>
                  {user.photoURL ? (
                    <Image
                      source={{ uri: user.photoURL }}
                      style={styles.largeProfileImage}
                    />
                  ) : (
                    <MaterialIcons name="account-circle" size={60} color="#4CAF50" />
                  )}
                  <Text style={styles.username}>
                    {user.displayName || "Player"}
                  </Text>
                  <Text style={styles.email}>{user.email}</Text>
                </View>

                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={handleProfileClick}
                >
                  <MaterialIcons name="person" size={20} color="white" />
                  <Text style={styles.profileButtonText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <MaterialIcons name="logout" size={20} color="white" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.userInfo}>
                  <MaterialIcons name="account-circle" size={60} color="#888" />
                  <Text style={styles.username}>Guest</Text>
                  <Text style={styles.guestText}>Sign in to save your progress</Text>
                </View>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLoginClick}
                >
                  <MaterialIcons name="login" size={20} color="white" />
                  <Text style={styles.loginButtonText}>Login / Sign Up</Text>
                </TouchableOpacity>
              </>
            )}

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
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  largeProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
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
  guestText: {
    color: "#888",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
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
    width: "100%",
    justifyContent: "center",
  },
  profileButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#d32f2f",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
    justifyContent: "center",
  },
  logoutButtonText: {
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
