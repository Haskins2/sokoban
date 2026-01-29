import { useUserProgress } from "@/contexts/UserProgressContext";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

export default function LevelSelect() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isLevelComplete } = useUserProgress();

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      const q = query(collection(db, "levels"), orderBy("levelNumber"));
      const querySnapshot = await getDocs(q);
      const fetchedChapters = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChapters(fetchedChapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChapterImage = (chapterNum: number) => {
    const chapterImages: { [key: number]: any } = {
      1: require("../assets/images/chapter_text/chapter_1.png"),
      2: require("../assets/images/chapter_text/chapter_2.png"),
      3: require("../assets/images/chapter_text/chapter_3.png"),
    };
    return chapterImages[chapterNum];
  };

  const handleChapterSelect = (level: any) => {
    router.push({
      pathname: "/main",
      params: { levelData: JSON.stringify(level) },
    });
  };

  const renderChapterItem = ({ item }: { item: any }) => {
    const chapterNum = item.levelNumber;

    // Only render for chapters 1-3
    if (chapterNum > 3) {
      return null;
    }

    const chapterImage = getChapterImage(chapterNum);

    if (!chapterImage) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.chapterItemContainer}
        onPress={() => handleChapterSelect(item)}
      >
        <Image
          source={chapterImage}
          style={styles.chapterTextImage}
          resizeMode="contain"
        />
        <View style={styles.starsContainer}>
          {[1, 2, 3].map((star, index) => (
            <Image
              key={index}
              source={require("../assets/images/stars/star_full.png")}
              style={styles.starIcon}
              resizeMode="contain"
            />
          ))}
        </View>
      </TouchableOpacity>
    );
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
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push("/home")}>
          <Image
            source={require("../assets/images/main_menu/home_icon.png")}
            style={styles.headerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Image
            source={require("../assets/images/main_menu/profile_icon.png")}
            style={styles.headerIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <Image
        source={require("../assets/images/main_menu/chapter_select_text.png")}
        style={styles.titleImage}
        resizeMode="contain"
      />

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={renderChapterItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 1000,
  },
  headerIcon: {
    width: 30,
    height: 40,
  },
  titleImage: {
    width: 350,
    height: 60,
    marginBottom: 30,
  },
  listContent: {
    paddingBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  chapterItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "85%",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  chapterTextImage: {
    width: 180,
    height: 50,
    marginRight: 20,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    width: 35,
    height: 35,
    margin: 5,
  },
});
