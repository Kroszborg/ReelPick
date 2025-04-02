import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getMovieDetails, getImageUrl } from "../api/tmdb";
import {
  addToWatchlist,
  getWatchlist,
  addWatchedMovie,
  getWatchedMovies,
  updateMovieRating,
  removeFromWatchlist,
  UserMovie,
} from "../services/DatabaseService";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "MovieDetail">;

interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
}

const MovieDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { movieId } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watched, setWatched] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userReview, setUserReview] = useState<string | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [tempRating, setTempRating] = useState<number>(0);
  const [tempReview, setTempReview] = useState<string>("");

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);

        // Fetch movie details from TMDb
        const movieData = await getMovieDetails(movieId);
        setMovie(movieData);

        // Check if movie is in user's watchlist
        if (user) {
          const watchlist = await getWatchlist(user.uid);
          const isInWatchlist = watchlist.some(
            (m: { id: number }) => m.id === movieId
          );
          setInWatchlist(isInWatchlist);

          // Check if movie has been watched and get user rating/review
          const watchedMovies = await getWatchedMovies(user.uid);
          const watchedMovie = watchedMovies.find(
            (m: UserMovie) => m.id === movieId
          );

          if (watchedMovie) {
            setWatched(true);
            setUserRating(watchedMovie.rating || null);
            setUserReview(watchedMovie.review || null);
          }
        }
      } catch (error) {
        console.error("Error fetching movie details:", error);
        Alert.alert("Error", "Failed to load movie details.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId, user]);

  const handleAddToWatchlist = async () => {
    if (!user || !movie) return;

    try {
      await addToWatchlist(user.uid, {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        overview: movie.overview,
      });

      setInWatchlist(true);
      Alert.alert("Success", `${movie.title} added to your watchlist.`);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      Alert.alert("Error", "Failed to add movie to watchlist.");
    }
  };

  const handleRemoveFromWatchlist = async () => {
    if (!user || !movie) return;

    try {
      await removeFromWatchlist(user.uid, movie.id);
      setInWatchlist(false);
      Alert.alert("Success", `${movie.title} removed from your watchlist.`);
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      Alert.alert("Error", "Failed to remove movie from watchlist.");
    }
  };

  const handleMarkAsWatched = () => {
    if (!user || !movie) return;

    // Set initial rating/review for modal
    setTempRating(userRating || 0);
    setTempReview(userReview || "");
    setRatingModalVisible(true);
  };

  const handleSaveRating = async () => {
    if (!user || !movie) return;

    try {
      if (watched) {
        // Update existing rating
        await updateMovieRating(user.uid, movie.id, tempRating, tempReview);
      } else {
        // Add new watched movie with rating
        await addWatchedMovie(
          user.uid,
          {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            overview: movie.overview,
          },
          tempRating,
          tempReview
        );

        // Remove from watchlist if it was there
        if (inWatchlist) {
          setInWatchlist(false);
        }
      }

      setWatched(true);
      setUserRating(tempRating);
      setUserReview(tempReview);
      setRatingModalVisible(false);

      Alert.alert("Success", `Rating saved for ${movie.title}.`);
    } catch (error) {
      console.error("Error saving rating:", error);
      Alert.alert("Error", "Failed to save rating.");
    }
  };

  const renderRatingStars = (
    rating: number,
    size = 24,
    interactive = false
  ) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => interactive && setTempRating(i)}
          disabled={!interactive}
        >
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={size}
            color={i <= rating ? theme.starFilled : theme.starEmpty}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingStars}>{stars}</View>;
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.text }]}>
          Failed to load movie details.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView>
        {/* Backdrop Image */}
        <View style={styles.backdropContainer}>
          <Image
            source={{
              uri:
                getImageUrl(movie.backdrop_path, "original") ||
                getImageUrl(movie.poster_path, "original") ||
                "https://via.placeholder.com/500x281?text=No+Image",
            }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
          <View
            style={[
              styles.backdropGradient,
              { backgroundColor: theme.backdrop },
            ]}
          />
        </View>

        {/* Movie Info */}
        <View
          style={[
            styles.movieInfoContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <View style={styles.posterContainer}>
            <Image
              source={{
                uri:
                  getImageUrl(movie.poster_path) ||
                  "https://via.placeholder.com/342x513?text=No+Image",
              }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.detailsContainer}>
            <Text style={[styles.title, { color: theme.text }]}>
              {movie.title}
            </Text>

            <View style={styles.yearRuntimeContainer}>
              <Text style={[styles.yearText, { color: theme.secondaryText }]}>
                {movie.release_date
                  ? movie.release_date.substring(0, 4)
                  : "N/A"}
              </Text>
              {movie.runtime > 0 && (
                <Text
                  style={[styles.runtimeText, { color: theme.secondaryText }]}
                >
                  {formatRuntime(movie.runtime)}
                </Text>
              )}
            </View>

            <View style={styles.genreContainer}>
              {movie.genres.map((genre) => (
                <View
                  key={genre.id}
                  style={[styles.genreTag, { backgroundColor: theme.border }]}
                >
                  <Text style={[styles.genreText, { color: theme.text }]}>
                    {genre.name}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color={theme.starFilled} />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {movie.vote_average.toFixed(1)}/10
              </Text>
              <Text style={[styles.voteCount, { color: theme.secondaryText }]}>
                ({movie.vote_count.toLocaleString()} votes)
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={[
            styles.actionContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {watched ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAsWatched}
            >
              <Ionicons name="create-outline" size={24} color={theme.icon} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Update Rating
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAsWatched}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color={theme.icon}
              />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Mark as Watched
              </Text>
            </TouchableOpacity>
          )}

          {inWatchlist ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRemoveFromWatchlist}
            >
              <Ionicons name="bookmark" size={24} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.primary }]}>
                In Watchlist
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddToWatchlist}
              disabled={watched}
            >
              <Ionicons
                name="bookmark-outline"
                size={24}
                color={watched ? theme.secondaryText : theme.icon}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: watched ? theme.secondaryText : theme.text },
                ]}
              >
                Add to Watchlist
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* User Rating (if watched) */}
        {watched && userRating && (
          <View
            style={[
              styles.userRatingContainer,
              { backgroundColor: theme.card },
            ]}
          >
            <Text style={[styles.userRatingTitle, { color: theme.text }]}>
              Your Rating
            </Text>
            {renderRatingStars(userRating)}
            {userReview && (
              <View
                style={[
                  styles.userReviewContainer,
                  { backgroundColor: theme.background },
                ]}
              >
                <Text
                  style={[styles.userReview, { color: theme.secondaryText }]}
                >
                  "{userReview}"
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Overview */}
        <View
          style={[styles.overviewContainer, { backgroundColor: theme.card }]}
        >
          <Text style={[styles.overviewTitle, { color: theme.text }]}>
            Overview
          </Text>
          <Text style={[styles.overviewText, { color: theme.secondaryText }]}>
            {movie.overview || "No overview available."}
          </Text>
        </View>
      </ScrollView>

      {/* Rating Modal with Keyboard Avoiding View */}
      <Modal
        visible={ratingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: theme.modalBackground },
              ]}
            >
              <View
                style={[styles.modalContent, { backgroundColor: theme.card }]}
              >
                {/* Header with close button */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {watched ? "Update Rating" : "Rate This Movie"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setRatingModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={theme.icon} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.ratingLabel, { color: theme.text }]}>
                  Your Rating
                </Text>
                {renderRatingStars(tempRating, 36, true)}

                <Text style={[styles.reviewLabel, { color: theme.text }]}>
                  Your Review (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.reviewInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Write your thoughts about the movie..."
                  placeholderTextColor={theme.secondaryText}
                  value={tempReview}
                  onChangeText={setTempReview}
                  multiline
                  maxLength={500}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.cancelButton,
                      { backgroundColor: theme.background },
                    ]}
                    onPress={() => setRatingModalVisible(false)}
                  >
                    <Text
                      style={[styles.cancelButtonText, { color: theme.text }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.saveButton,
                      {
                        backgroundColor:
                          tempRating === 0
                            ? theme.secondaryText
                            : theme.primary,
                      },
                    ]}
                    onPress={handleSaveRating}
                    disabled={tempRating === 0}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backdropContainer: {
    position: "relative",
    height: 220,
  },
  backdropImage: {
    width: "100%",
    height: "100%",
  },
  backdropGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  movieInfoContainer: {
    flexDirection: "row",
    padding: 16,
  },
  posterContainer: {
    width: 120,
    height: 180,
    marginRight: 16,
  },
  posterImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  yearRuntimeContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  yearText: {
    fontSize: 14,
    marginRight: 16,
  },
  runtimeText: {
    fontSize: 14,
  },
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  genreTag: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  voteCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  actionContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    marginTop: 4,
    fontSize: 14,
  },
  userRatingContainer: {
    padding: 16,
    marginTop: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  userRatingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: "row",
  },
  starIcon: {
    marginRight: 4,
  },
  userReviewContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  userReview: {
    fontSize: 14,
    fontStyle: "italic",
  },
  overviewContainer: {
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  overviewText: {
    fontSize: 14,
    lineHeight: 22,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 8,
    padding: 20,
    width: "100%",
    maxHeight: "80%", // Limit height to ensure buttons are visible
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100, // Reduced height to ensure buttons are visible
    textAlignVertical: "top",
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    marginRight: 8,
  },
  cancelButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  saveButton: {
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default MovieDetailScreen;
