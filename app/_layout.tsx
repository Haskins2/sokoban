import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { UserProgressProvider } from "@/contexts/UserProgressContext";

// (initial loading screen)
SplashScreen.preventAutoHideAsync();

// Custom hook for loading screen functionality
function useLoadingScreen() {
  const [loadingVisible, setLoadingVisible] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    async function hideLoading() {
      // Wait minimum display time
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Hide the Expo loading screen
      await SplashScreen.hideAsync();

      // Trigger fade-out animation
      opacity.value = withTiming(0, { duration: 400 });

      // Hide loading after animation completes
      setTimeout(() => {
        setLoadingVisible(false);
      }, 400);
    }

    hideLoading();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { loadingVisible, animatedStyle };
}

// Custom theme with transparent background
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "transparent",
  },
};

export default function RootLayout() {
  const { loadingVisible, animatedStyle } = useLoadingScreen();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000" }}>
      <AuthProvider>
        <UserProgressProvider>
          <ThemeProvider value={CustomDarkTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: "transparent",
                  paddingTop: 60,
                },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="home" />
              <Stack.Screen name="main" />
              <Stack.Screen name="chapter_select" />
              <Stack.Screen name="level_editor" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </UserProgressProvider>
      </AuthProvider>

      {loadingVisible && (
        <Animated.View style={[styles.loadingContainer, animatedStyle]}>
          <Image
            source={require("../assets/images/app_logo.png")}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    zIndex: 9999,
  },
  loadingLogo: {
    width: 250,
    height: 250,
  },
});
