import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  getWatchlist,
  removeFromWatchlist,
  Movie,
} from "../services/DatabaseService";
import { getImageUrl } from "../api/tmdb";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Main">;

const WatchlistScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWatchlist = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getWatchlist(user.uid);
      setWatchlist(data);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch watchlist when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchWatchlist();
    }, [user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWatchlist();
  };

  const handleMoviePress = (movieId: number) => {
    navigation.navigate("MovieDetail", { movieId });
  };

  const handleRemoveMovie = async (movieId: number) => {
    if (!user) return;

    Alert.alert(
      "Remove from Watchlist",
      "Are you sure you want to remove this movie from your watchlist?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: async () => {
            try {
              await removeFromWatchlist(user.uid, movieId);
              setWatchlist(watchlist.filter((movie) => movie.id !== movieId));
            } catch (error) {
              console.error("Error removing from watchlist:", error);
              Alert.alert("Error", "Failed to remove movie from watchlist.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <View style={[styles.movieItem, { backgroundColor: theme.card }]}>
      <TouchableOpacity
        style={styles.movieContent}
        onPress={() => handleMoviePress(item.id)}
      >
        <Image
          source={{
            uri:
              getImageUrl(item.poster_path) ||
              "https://via.placeholder.com/92x138?text=No+Image",
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
          <Text style={[styles.movieYear, { color: theme.secondaryText }]}>
            {item.release_date ? item.release_date.substring(0, 4) : "N/A"}
          </Text>
          <Text
            style={[styles.movieOverview, { color: theme.secondaryText }]}
            numberOfLines={2}
          >
            {item.overview || "No description available."}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveMovie(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>My Watchlist</Text>
      </View>

      <FlatList
        data={watchlist}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMovieItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="bookmark-outline"
              size={64}
              color={theme.secondaryText}
            />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              Your watchlist is empty
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
              Movies you want to watch will appear here
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: theme.primary }]}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  movieItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  movieContent: {
    flex: 1,
    flexDirection: "row",
  },
  moviePoster: {
    width: 92,
    height: 138,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  movieYear: {
    fontSize: 14,
    marginTop: 2,
  },
  movieOverview: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  removeButton: {
    padding: 16,
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

export default WatchlistScreen;
