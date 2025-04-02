// src/navigation/index.tsx
import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthState } from "../hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import HeaderLeft from "../components/HeaderLeft";

// Main Screens
import HomeScreen from "../screens/HomeScreen";
import SearchScreen from "../screens/SearchScreen";
import WatchlistScreen from "../screens/WatchlistScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MovieDetailScreen from "../screens/MovieDetailScreen";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import LoadingScreen from "../screens/LoadingScreen";

// Settings Screens
import ProfileEditScreen from "../screens/settings/ProfileEditScreen";
import NotificationSettingsScreen from "../screens/settings/NotificationSettingsScreen";
import PrivacySettingsScreen from "../screens/settings/PrivacySettingsScreen";

// Stack Types
export type RootStackParamList = {
  Main: undefined;
  MovieDetail: { movieId: number };
  ProfileEdit: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();

// Tab Navigator for the main app
const TabNavigator = () => {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Remove headers from tab screens
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Watchlist") {
            iconName = focused ? "bookmark" : "bookmark-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Auth Navigator for login/register
const AuthNavigator = () => {
  const { theme } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={({ navigation }) => ({
          headerShown: true,
          headerTitle: "Create Account",
          headerLeft: () => (
            <HeaderLeft onPress={() => navigation.navigate("Login")} />
          ),
          headerStyle: {
            backgroundColor: theme.card,
          },
          headerTintColor: theme.text,
        })}
      />
    </AuthStack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useAuthState();
  const { theme, isDark } = useTheme();

  // Create custom navigation theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? (
        <Stack.Navigator
          screenOptions={({ navigation }) => ({
            headerShown: true,
            contentStyle: {
              backgroundColor: theme.background,
            },
            headerStyle: {
              backgroundColor: theme.card,
            },
            headerTintColor: theme.text,
            headerLeft: () => <HeaderLeft />,
          })}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MovieDetail"
            component={MovieDetailScreen}
            options={{ headerTitle: "Movie Details", headerShown: false }}
          />
          <Stack.Screen
            name="ProfileEdit"
            component={ProfileEditScreen}
            options={{ headerTitle: "Edit Profile" }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{ headerTitle: "Notifications" }}
          />
          <Stack.Screen
            name="PrivacySettings"
            component={PrivacySettingsScreen}
            options={{ headerTitle: "Privacy" }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
