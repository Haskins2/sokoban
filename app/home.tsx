import { UserMenu } from "@/components/UserMenu";
import { useUserProgress } from "@/contexts/UserProgressContext";
import {
  Canvas,
  Image as SkiaImage,
  useImage,
} from "@shopify/react-native-skia";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import {
  ImageBackground,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

export default function HomeScreen() {
  const router = useRouter();
  const { getNextIncompleteLevel } = useUserProgress();

  const logoImage = useImage(
    require("../assets/images/app_logo_large_350.png"),
  );
  const startImage = useImage(require("../assets/images/START.png"));
  const levelSelectImage = useImage(
    require("../assets/images/LEVEL_SELECT.png"),
  );

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
    <ImageBackground
      source={require("../assets/images/background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <UserMenu />
      {Platform.OS === "web" ? (
        <Image
          source={require("../assets/images/app_logo_large_350.png")}
          style={styles.logo}
          contentFit="contain"
          transition={0}
        />
      ) : (
        <Canvas style={styles.logo}>
          {logoImage && (
            <SkiaImage
              image={logoImage}
              x={0}
              y={0}
              width={118 * 3.1}
              height={49 * 3.5}
              fit="contain"
            />
          )}
        </Canvas>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handlePlayClick}>
          {Platform.OS === "web" ? (
            <Image
              source={require("../assets/images/START.png")}
              style={styles.startButton}
              contentFit="contain"
              transition={0}
            />
          ) : (
            <Canvas style={styles.startButton} pointerEvents="none">
              {startImage && (
                <SkiaImage
                  image={startImage}
                  x={0}
                  y={0}
                  width={95 * 3}
                  height={23 * 3}
                  fit="contain"
                />
              )}
            </Canvas>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/level_select")}>
          {Platform.OS === "web" ? (
            <Image
              source={require("../assets/images/LEVEL_SELECT.png")}
              style={styles.levelSelectButton}
              contentFit="contain"
              transition={0}
            />
          ) : (
            <Canvas style={styles.levelSelectButton} pointerEvents="none">
              {levelSelectImage && (
                <SkiaImage
                  image={levelSelectImage}
                  x={0}
                  y={0}
                  width={95 * 3}
                  height={22 * 3}
                  fit="contain"
                />
              )}
            </Canvas>
          )}
        </TouchableOpacity>
      </View>
    </ImageBackground>
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
    width: 118 * 3.2,
    height: 49 * 3.3,
    marginBottom: 50,
  },
  buttonContainer: {
    gap: 20,
    alignItems: "center",
  },
  startButton: {
    width: 95 * 3,
    height: 23 * 3,
  },
  levelSelectButton: {
    width: 95 * 3,
    height: 22 * 3,
  },
});
