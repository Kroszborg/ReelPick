import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  SectionList,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getWatchedMovies, UserMovie } from "../services/DatabaseService";
import { getImageUrl } from "../api/tmdb";
import { Ionicons } from "@expo/vector-icons";
import ThemeToggle from "../components/ThemeToggle";
import ErrorDisplay from "../components/ErrorDisplay";
import { useApi } from "../hooks/useApi";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Main">;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalWatched: 0,
    favorites: 0,
    averageRating: 0,
    topGenres: [] as { name: string; count: number }[],
    totalWatchTime: 0, // In minutes
  });

  // Use API hook for fetching watched movies
  const {
    data: watchedMovies,
    loading,
    error,
    execute: fetchWatchedMovies,
  } = useApi<UserMovie[], [string]>((userId) => getWatchedMovies(userId));

  const loadMovies = useCallback(async () => {
    if (!user) return;
    return fetchWatchedMovies(user.uid);
  }, [user, fetchWatchedMovies]);

  // Calculate stats from watched movies
  useEffect(() => {
    if (watchedMovies && watchedMovies.length > 0) {
      // Count total watched movies
      const totalWatched = watchedMovies.length;

      // Count favorites (rated 4 or higher)
      const favorites = watchedMovies.filter(
        (m) => m.rating && m.rating >= 4
      ).length;

      // Calculate average rating
      const totalRating = watchedMovies.reduce(
        (sum, movie) => sum + (movie.rating || 0),
        0
      );
      const averageRating = totalRating / totalWatched;

      // Set the calculated stats
      setStats({
        totalWatched,
        favorites,
        averageRating,
        topGenres: [], // Would need genre data from API
        totalWatchTime: 0, // Would need runtime data from API
      });
    } else {
      setStats({
        totalWatched: 0,
        favorites: 0,
        averageRating: 0,
        topGenres: [],
        totalWatchTime: 0,
      });
    }
  }, [watchedMovies]);

  // Only fetch movies when screen is first focused or on manual refresh
  // This prevents constant re-fetching and auto-updates
  useFocusEffect(
    useCallback(() => {
      // Only load if we don't have data yet or if explicitly refreshing
      if (!watchedMovies && !loading) {
        loadMovies();
      }
    }, [watchedMovies, loading, loadMovies])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMovies();
    setRefreshing(false);
  };

  const handleMoviePress = (movieId: number) => {
    navigation.navigate("MovieDetail", { movieId });
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Error logging out:", error);
          }
        },
      },
    ]);
  };

  const renderRatingStars = (rating: number | undefined) => {
    if (!rating) return null;

    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? theme.starFilled : theme.starEmpty}
          style={styles.starIcon}
        />
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  const renderMovieItem = ({ item }: { item: UserMovie }) => (
    <TouchableOpacity
      style={[styles.movieItem, { backgroundColor: theme.card }]}
      onPress={() => handleMoviePress(item.id)}
    >
      <Image
        source={{
          uri:
            getImageUrl(item.poster_path) ||
            "https://via.placeholder.com/100x150?text=No+Image",
        }}
        style={styles.moviePoster}
        resizeMode="cover"
      />
      <View style={styles.movieInfo}>
        <Text
          style={[styles.movieTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {renderRatingStars(item.rating)}
        {item.review && (
          <Text
            style={[styles.reviewText, { color: theme.secondaryText }]}
            numberOfLines={2}
          >
            "{item.review}"
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Navigate to appropriate settings screens
  const handleSettingsNavigation = (key: string) => {
    switch (key) {
      case "profile":
        navigation.navigate("ProfileEdit");
        break;
      case "notifications":
        navigation.navigate("NotificationSettings");
        break;
      case "privacy":
        navigation.navigate("PrivacySettings");
        break;
      case "logout":
        handleLogout();
        break;
      default:
        break;
    }
  };

  // Settings sections data
  const settingsSections = [
    {
      title: "Appearance",
      data: [{ key: "theme" }],
    },
    {
      title: "Account",
      data: [
        { key: "profile", title: "Edit Profile", icon: "person-outline" },
        {
          key: "notifications",
          title: "Notifications",
          icon: "notifications-outline",
        },
        { key: "privacy", title: "Privacy", icon: "shield-outline" },
        {
          key: "logout",
          title: "Logout",
          icon: "log-out-outline",
          danger: true,
        },
      ],
    },
  ];

  // Render a settings item
  const renderSettingsItem = ({ item }: { item: any }) => {
    if (item.key === "theme") {
      return <ThemeToggle containerStyle={{ marginBottom: 0 }} />;
    }

    return (
      <TouchableOpacity
        style={[styles.settingsItem, { borderBottomColor: theme.border }]}
        onPress={() => handleSettingsNavigation(item.key)}
      >
        <View style={styles.settingsIcon}>
          <Ionicons
            name={item.icon}
            size={22}
            color={item.danger ? theme.error : theme.icon}
          />
        </View>
        <Text
          style={[
            styles.settingsText,
            { color: item.danger ? theme.error : theme.text },
          ]}
        >
          {item.title}
        </Text>
        <Ionicons name="chevron-forward" size={22} color={theme.icon} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.displayName?.[0] || user?.email?.[0] || "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.username, { color: theme.text }]}>
              {user?.displayName || "Movie Lover"}
            </Text>
            <Text style={[styles.email, { color: theme.secondaryText }]}>
              {user?.email}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats.totalWatched}
          </Text>
          <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
            Watched
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats.favorites}
          </Text>
          <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
            Favorites
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats.averageRating.toFixed(1)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
            Avg Rating
          </Text>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Settings Section */}
        <SectionList
          sections={settingsSections}
          keyExtractor={(item) => item.key}
          renderItem={renderSettingsItem}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              style={[
                styles.sectionHeader,
                {
                  color: theme.secondaryText,
                  backgroundColor: theme.background,
                },
              ]}
            >
              {title.toUpperCase()}
            </Text>
          )}
          stickySectionHeadersEnabled={false}
          scrollEnabled={false}
          style={styles.settingsList}
        />

        {/* Recently Watched Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recently Watched
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <ErrorDisplay
            message="Couldn't load your watched movies"
            onRetry={() => loadMovies()}
          />
        ) : watchedMovies && watchedMovies.length > 0 ? (
          <FlatList
            data={watchedMovies.slice(0, 10)} // Show only most recent 10
            keyExtractor={(item) => `${item.id}`}
            renderItem={renderMovieItem}
            contentContainerStyle={styles.moviesList}
            horizontal={false}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="film-outline"
              size={64}
              color={theme.secondaryText}
            />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No watched movies yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
              Movies you've watched will appear here
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate("Main")}
            >
              <Text style={styles.exploreButtonText}>Explore Movies</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E50914",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  profileInfo: {
    marginLeft: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    paddingVertical: 16,
    marginTop: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  settingsList: {
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingsIcon: {
    width: 30,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  sectionContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  moviesList: {
    padding: 16,
  },
  movieItem: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  moviePoster: {
    width: 80,
    height: 120,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  ratingContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  starIcon: {
    marginRight: 2,
  },
  reviewText: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  exploreButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ProfileScreen;
