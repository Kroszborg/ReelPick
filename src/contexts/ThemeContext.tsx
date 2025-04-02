import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the theme colors
export const lightTheme = {
  background: "#f5f5f5",
  card: "#ffffff",
  text: "#333333",
  secondaryText: "#777777",
  primary: "#E50914",
  border: "#dddddd",
  icon: "#555555",
  starFilled: "#FFD700",
  starEmpty: "#cccccc",
  error: "#ff3b30",
  success: "#4cd964",
  shadow: "#000000",
  backdrop: "rgba(245, 245, 245, 0.8)",
  modalBackground: "rgba(0, 0, 0, 0.5)",
  inputBackground: "#ffffff",
};

export const darkTheme = {
  background: "#121212",
  card: "#1e1e1e",
  text: "#ffffff",
  secondaryText: "#bbbbbb",
  primary: "#E50914",
  border: "#333333",
  icon: "#bbbbbb",
  starFilled: "#FFD700",
  starEmpty: "#555555",
  error: "#ff453a",
  success: "#32d74b",
  shadow: "#000000",
  backdrop: "rgba(18, 18, 18, 0.8)",
  modalBackground: "rgba(0, 0, 0, 0.7)",
  inputBackground: "#2c2c2c",
};

// Create the theme context
type ThemeType = "light" | "dark" | "system";

interface ThemeContextType {
  theme: typeof lightTheme | typeof darkTheme;
  themeType: ThemeType;
  isDark: boolean;
  setThemeType: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themeType: "system",
  isDark: false,
  setThemeType: () => {},
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const deviceTheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>("system");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("themeType");
        if (savedTheme) {
          setThemeType(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Save theme preference to storage
  const setTheme = async (type: ThemeType) => {
    try {
      setThemeType(type);
      await AsyncStorage.setItem("themeType", type);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  // Determine if dark mode should be used
  const isDark =
    themeType === "dark" || (themeType === "system" && deviceTheme === "dark");

  // Get the appropriate theme object
  const theme = isDark ? darkTheme : lightTheme;

  // Skip rendering until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeType,
        isDark,
        setThemeType: setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme
export const useTheme = () => {
  return useContext(ThemeContext);
};
