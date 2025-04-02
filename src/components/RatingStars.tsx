import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onRatingChange,
}) => {
  const { theme } = useTheme();

  const handlePress = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      // If user taps the current rating again, reset it
      if (selectedRating === rating) {
        onRatingChange(0);
      } else {
        onRatingChange(selectedRating);
      }
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(maxRating)].map((_, i) => {
        const starRating = i + 1;
        return (
          <TouchableOpacity
            key={i}
            style={styles.starButton}
            onPress={() => handlePress(starRating)}
            disabled={!interactive}
            activeOpacity={interactive ? 0.7 : 1}
          >
            <Ionicons
              name={starRating <= rating ? "star" : "star-outline"}
              size={size}
              color={starRating <= rating ? theme.starFilled : theme.starEmpty}
              style={styles.star}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starButton: {
    padding: 2,
  },
  star: {
    marginRight: 2,
  },
});

export default RatingStars;
