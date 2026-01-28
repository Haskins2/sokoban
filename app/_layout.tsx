import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
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
import { useColorScheme } from "@/hooks/use-color-scheme";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Custom theme with transparent background
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "transparent",
  },
};

const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [splashVisible, setSplashVisible] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    async function prepare() {
      try {
        // Minimum display time of 500ms
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();

        // Trigger fade-out animation
        opacity.value = withTiming(0, { duration: 400 });

        // Hide splash after animation completes
        setTimeout(() => {
          setSplashVisible(false);
        }, 400);
      }
    }

    prepare();
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000" }}>
      <AuthProvider>
        <UserProgressProvider>
          <ThemeProvider
            value={
              colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme
            }
          >
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
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </UserProgressProvider>
      </AuthProvider>

      {splashVisible && (
        <Animated.View style={[styles.splashContainer, animatedStyle]}>
          <Image
            source={require("../assets/images/app_logo.png")}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
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
  splashLogo: {
    width: 250,
    height: 250,
  },
});
