import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface MovieSkeletonProps {
  horizontal?: boolean;
}

const MovieSkeleton: React.FC<MovieSkeletonProps> = ({ horizontal = true }) => {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  // Generate a list or grid of skeleton items based on orientation
  const renderItems = () => {
    if (horizontal) {
      return (
        <View style={styles.horizontalContainer}>
          {[...Array(5)].map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
              <Animated.View
                style={[
                  styles.poster,
                  {
                    backgroundColor: isDark ? "#333" : "#ddd",
                    opacity: fadeAnim,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.title,
                  {
                    backgroundColor: isDark ? "#333" : "#ddd",
                    opacity: fadeAnim,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.rating,
                  {
                    backgroundColor: isDark ? "#333" : "#ddd",
                    opacity: fadeAnim,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      );
    } else {
      return (
        <View style={styles.gridContainer}>
          {[...Array(4)].map((_, index) => (
            <View key={index} style={styles.gridItem}>
              <Animated.View
                style={[
                  styles.gridPoster,
                  {
                    backgroundColor: isDark ? "#333" : "#ddd",
                    opacity: fadeAnim,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.title,
                  {
                    backgroundColor: isDark ? "#333" : "#ddd",
                    opacity: fadeAnim,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.rating,
                  {
                    backgroundColor: isDark ? "#333" : "#ddd",
                    opacity: fadeAnim,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderItems()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  horizontalContainer: {
    flexDirection: "row",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  skeletonCard: {
    width: 120,
    marginHorizontal: 8,
  },
  gridItem: {
    width: "48%",
    marginBottom: 16,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  gridPoster: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  title: {
    height: 15,
    marginTop: 8,
    borderRadius: 4,
    width: "80%",
  },
  rating: {
    height: 12,
    marginTop: 6,
    borderRadius: 4,
    width: "50%",
  },
});

export default MovieSkeleton;
