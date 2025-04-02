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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Main">;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [watchedMovies, setWatchedMovies] = useState<UserMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWatchedMovies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getWatchedMovies(user.uid);
      // Sort by recently watched
      const sortedData = [...data].sort((a, b) => {
        const dateA = a.watchedDate ? new Date(a.watchedDate) : new Date(0);
        const dateB = b.watchedDate ? new Date(b.watchedDate) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setWatchedMovies(sortedData);
    } catch (error) {
      console.error("Error fetching watched movies:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch watched movies when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchWatchedMovies();
    }, [user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWatchedMovies();
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: theme.primary }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {watchedMovies.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
            Watched
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {watchedMovies.filter((m) => m.rating && m.rating >= 4).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
            Favorites
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {(
              watchedMovies.reduce(
                (sum, movie) => sum + (movie.rating || 0),
                0
              ) / (watchedMovies.length || 1)
            ).toFixed(1)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
            Avg Rating
          </Text>
        </View>
      </View>

      {/* Theme Toggle Section */}
      <ThemeToggle containerStyle={{ marginHorizontal: 16, marginTop: 16 }} />

      <View
        style={[styles.sectionHeader, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Recently Watched
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={watchedMovies}
          keyExtractor={(item) => `${item.id}`}
          renderItem={renderMovieItem}
          contentContainerStyle={styles.moviesList}
          horizontal={false}
          numColumns={2}
          columnWrapperStyle={styles.moviesRow}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="film-outline"
                size={64}
                color={theme.secondaryText}
              />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No watched movies yet
              </Text>
              <Text
                style={[styles.emptySubtext, { color: theme.secondaryText }]}
              >
                Movies you've watched will appear here
              </Text>
              <TouchableOpacity
                style={[
                  styles.exploreButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => navigation.navigate("Main")}
              >
                <Text style={styles.exploreButtonText}>Explore Movies</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      )}
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
  sectionHeader: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  moviesList: {
    padding: 8,
  },
  moviesRow: {
    justifyContent: "space-between",
  },
  movieItem: {
    width: "48%",
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
    width: "100%",
    height: 180,
  },
  movieInfo: {
    padding: 8,
  },
  movieTitle: {
    fontSize: 14,
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
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
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
