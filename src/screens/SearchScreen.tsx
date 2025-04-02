import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  StatusBar,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { useTheme } from "../contexts/ThemeContext";
import { searchMovies, getImageUrl } from "../api/tmdb";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Main">;

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
}

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [previousQuery, setPreviousQuery] = useState("");

  // Restore previous search state when returning to this screen
  useFocusEffect(
    useCallback(() => {
      // If we had a previous search and the query is empty, restore it
      if (previousQuery && !query) {
        setQuery(previousQuery);
        handleSearch(previousQuery, false);
      }
    }, [previousQuery])
  );

  const handleSearch = async (searchQuery = query, updatePrevious = true) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      Keyboard.dismiss();
      const data = await searchMovies(searchQuery);
      setResults(data.results);
      setSearched(true);

      // Save the query for when we return to this screen
      if (updatePrevious) {
        setPreviousQuery(searchQuery);
      }
    } catch (error) {
      console.error("Error searching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoviePress = (movieId: number) => {
    navigation.navigate("MovieDetail", { movieId });
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setPreviousQuery("");
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={[styles.movieItem, { backgroundColor: theme.card }]}
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
        <Text style={[styles.movieRating, { color: theme.secondaryText }]}>
          ⭐ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}
        </Text>
        <Text
          style={[styles.movieOverview, { color: theme.secondaryText }]}
          numberOfLines={2}
        >
          {item.overview || "No description available."}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View
        style={[styles.customHeader, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Search</Text>
      </View>

      <View
        style={[styles.searchContainer, { backgroundColor: theme.background }]}
      >
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={22}
            color={theme.secondaryText}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.text,
              },
            ]}
            placeholder="Search for movies..."
            placeholderTextColor={theme.secondaryText}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons
                name="close-circle"
                size={22}
                color={theme.secondaryText}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: theme.primary }]}
          onPress={() => handleSearch()}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovieItem}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={64}
                  color={theme.secondaryText}
                />
                <Text
                  style={[styles.emptyText, { color: theme.secondaryText }]}
                >
                  No movies found
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: theme.secondaryText }]}
                >
                  Try a different search term
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="film-outline"
                  size={64}
                  color={theme.secondaryText}
                />
                <Text
                  style={[styles.emptyText, { color: theme.secondaryText }]}
                >
                  Search for your favorite movies
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: theme.secondaryText }]}
                >
                  Find movies by title, actor, or director
                </Text>
              </View>
            )
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
  customHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  searchButton: {
    height: 48,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsList: {
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
  movieRating: {
    fontSize: 14,
    marginTop: 2,
  },
  movieOverview: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: "center",
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
    paddingHorizontal: 20,
  },
});

export default SearchScreen;
