import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import AppNavigator from "./src/navigation";
import { LogBox } from "react-native";
import NetworkStatusBar from "./src/components/NetworkStatusBar";

// Ignore specific warnings that might come from third-party libraries
LogBox.ignoreLogs([
  "AsyncStorage has been extracted from react-native",
  "Setting a timer",
  "Constants.platform.ios.model has been deprecated",
]);

// AppContent component that can access the theme
const AppContent = () => {
  const { isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AuthProvider>
        <NetworkStatusBar />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
