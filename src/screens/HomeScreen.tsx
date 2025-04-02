import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getRecommendedMovies } from "../services/DatabaseService";
import { getPopularMovies, getTrendingMovies, getImageUrl } from "../api/tmdb";
import { useApi } from "../hooks/useApi";
import ErrorDisplay from "../components/ErrorDisplay";
import MovieSkeleton from "../components/MovieSkeleton";
import NetworkStatusBar from "../components/NetworkStatusBar";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Main">;

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average?: number;
  score?: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Use separate API hooks for each data source
  const {
    data: trendingMovies,
    loading: trendingLoading,
    error: trendingError,
    execute: fetchTrending,
  } = useApi<any, []>(() => getTrendingMovies());

  const {
    data: popularMovies,
    loading: popularLoading,
    error: popularError,
    execute: fetchPopular,
  } = useApi<any, []>(() => getPopularMovies());

  const {
    data: recommendedMovies,
    loading: recommendedLoading,
    error: recommendedError,
    execute: fetchRecommended,
  } = useApi<Movie[], [string]>((userId) => getRecommendedMovies(userId));

  // Fetch all movie data
  const fetchAllMovies = async () => {
    fetchTrending();
    fetchPopular();

    if (user) {
      fetchRecommended(user.uid);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchAllMovies();
  }, [user]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllMovies();
    setRefreshing(false);
  };

  const handleMoviePress = (movieId: number) => {
    navigation.navigate("MovieDetail", { movieId });
  };

  // Render movie item component
  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => handleMoviePress(item.id)}
    >
      <Image
        source={{
          uri:
            getImageUrl(item.poster_path) ||
            "https://via.placeholder.com/342x513?text=No+Image",
        }}
        style={styles.moviePoster}
        resizeMode="cover"
      />
      <Text
        style={[styles.movieTitle, { color: theme.text }]}
        numberOfLines={1}
      >
        {item.title}
      </Text>
      {item.vote_average !== undefined && (
        <Text style={[styles.movieRating, { color: theme.secondaryText }]}>
          ⭐ {item.vote_average.toFixed(1)}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Movie list section component
  const MovieList = ({
    title,
    data,
    loading,
    error,
    onRetry,
    horizontal = true,
  }: {
    title: string;
    data: Movie[] | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    horizontal?: boolean;
  }) => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>

      {loading ? (
        <MovieSkeleton horizontal={horizontal} />
      ) : error ? (
        <ErrorDisplay
          message={`Couldn't load ${title.toLowerCase()}`}
          onRetry={onRetry}
        />
      ) : data && data.length > 0 ? (
        <FlatList
          horizontal={horizontal}
          data={data}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={renderMovieItem}
        />
      ) : (
        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
          No movies available
        </Text>
      )}
    </View>
  );

  // Main render
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <NetworkStatusBar />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <Text style={[styles.appName, { color: theme.primary }]}>
            ReelPick
          </Text>
        </View>

        <MovieList
          title="Trending Today"
          data={trendingMovies?.results}
          loading={trendingLoading}
          error={trendingError}
          onRetry={() => fetchTrending()}
        />

        {user && (
          <MovieList
            title="Recommended For You"
            data={recommendedMovies}
            loading={recommendedLoading}
            error={recommendedError}
            onRetry={() => fetchRecommended(user.uid)}
          />
        )}

        <MovieList
          title="Popular Movies"
          data={popularMovies?.results}
          loading={popularLoading}
          error={popularError}
          onRetry={() => fetchPopular()}
        />
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
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 8,
  },
  movieCard: {
    marginHorizontal: 8,
    width: 120,
    marginBottom: 16,
  },
  moviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  movieTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  movieRating: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    padding: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default HomeScreen;
