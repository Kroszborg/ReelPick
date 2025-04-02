import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getRecommendedMovies } from "../services/DatabaseService";
import { getPopularMovies, getTrendingMovies, getImageUrl } from "../api/tmdb";

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
  const { theme } = useTheme();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);

      // Get trending movies from TMDb
      const trendingData = await getTrendingMovies();
      setTrendingMovies(trendingData.results);

      // Get popular movies from TMDb
      const popularData = await getPopularMovies();
      setPopularMovies(popularData.results);

      // Get personalized recommendations if user is logged in
      if (user) {
        const recommended = await getRecommendedMovies(user.uid);
        setRecommendedMovies(recommended);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMovies();
  };

  const handleMoviePress = (movieId: number) => {
    navigation.navigate("MovieDetail", { movieId });
  };

  // Fixed renderItem function to ensure all text is within Text components
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

  const MovieList = ({
    title,
    data,
    horizontal = true,
  }: {
    title: string;
    data: Movie[];
    horizontal?: boolean;
  }) => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <FlatList
        horizontal={horizontal}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        renderItem={renderMovieItem}
      />
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
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <Text style={[styles.appName, { color: theme.primary }]}>
            ReelPick
          </Text>
        </View>

        <MovieList title="Trending Today" data={trendingMovies} />

        {recommendedMovies.length > 0 && (
          <MovieList title="Recommended For You" data={recommendedMovies} />
        )}

        <MovieList title="Popular Movies" data={popularMovies} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
  },
  appName: {
    fontSize: 24,
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
});

export default HomeScreen;
