import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

interface ThemeToggleProps {
  containerStyle?: object;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ containerStyle }) => {
  const { themeType, setThemeType, theme } = useTheme();

  const selectTheme = (type: "light" | "dark" | "system") => {
    setThemeType(type);
  };

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        { backgroundColor: theme.card },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Appearance</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            themeType === "light" && [
              styles.selectedOption,
              { borderColor: theme.primary },
            ],
          ]}
          onPress={() => selectTheme("light")}
        >
          <Ionicons
            name="sunny"
            size={24}
            color={themeType === "light" ? theme.primary : theme.icon}
          />
          <Text
            style={[
              styles.optionText,
              { color: theme.text },
              themeType === "light" && {
                color: theme.primary,
                fontWeight: "bold",
              },
            ]}
          >
            Light
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            themeType === "dark" && [
              styles.selectedOption,
              { borderColor: theme.primary },
            ],
          ]}
          onPress={() => selectTheme("dark")}
        >
          <Ionicons
            name="moon"
            size={24}
            color={themeType === "dark" ? theme.primary : theme.icon}
          />
          <Text
            style={[
              styles.optionText,
              { color: theme.text },
              themeType === "dark" && {
                color: theme.primary,
                fontWeight: "bold",
              },
            ]}
          >
            Dark
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            themeType === "system" && [
              styles.selectedOption,
              { borderColor: theme.primary },
            ],
          ]}
          onPress={() => selectTheme("system")}
        >
          <Ionicons
            name="phone-portrait"
            size={24}
            color={themeType === "system" ? theme.primary : theme.icon}
          />
          <Text
            style={[
              styles.optionText,
              { color: theme.text },
              themeType === "system" && {
                color: theme.primary,
                fontWeight: "bold",
              },
            ]}
          >
            System
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  option: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    marginHorizontal: 4,
  },
  selectedOption: {
    borderWidth: 2,
  },
  optionText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default ThemeToggle;
