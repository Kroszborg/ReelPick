import React from "react";
import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  forceBehavior?: "goBack" | "pop" | "popToTop";
}

const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  color,
  size = 24,
  forceBehavior,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (forceBehavior === "pop") {
      navigation.dispatch(CommonActions.goBack());
    } else if (forceBehavior === "popToTop") {
      navigation.dispatch((state) => {
        const routes = state.routes.slice(0, 1);
        return CommonActions.reset({
          ...state,
          routes,
          index: 0,
        });
      });
    } else {
      // Default behavior - goBack
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
        size={size}
        color={color || theme.text}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
});

export default BackButton;
