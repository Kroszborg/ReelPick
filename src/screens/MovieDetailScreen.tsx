import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../hooks/useApi';
import { getMovieDetails, getImageUrl } from '../api/tmdb';
import {
  addToWatchlist,
  getWatchlist,
  addWatchedMovie,
  getWatchedMovies,
  updateMovieRating,
  removeFromWatchlist,
  UserMovie,
} from '../services/DatabaseService';
import { Ionicons } from '@expo/vector-icons';
import ErrorDisplay from '../components/ErrorDisplay';
import RatingStars from '../components/RatingStars';
import RatingModal from '../components/RatingModal';
import NetworkStatusBar from '../components/NetworkStatusBar';

type Props = NativeStackScreenProps<RootStackParamList, 'MovieDetail'>;

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
  
  // State for user interactions
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watched, setWatched] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>('');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  
  // API hooks
  const {
    data: movie,
    loading: movieLoading,
    error: movieError,
    execute: fetchMovie
  } = useApi<MovieDetails, [number]>(id => getMovieDetails(id));
  
  const {
    loading: userDataLoading,
    error: userDataError,
    execute: fetchUserData
  } = useApi(async () => {
    if (!user) return;
    
    try {
      // Get watchlist status
      const watchlist: UserMovie[] = await getWatchlist(user.uid);
      const isInWatchlist: boolean = watchlist.some((m: UserMovie) => m.id === movieId);
      setInWatchlist(isInWatchlist);
      
      // Get watched status and rating
      const watchedMovies: UserMovie[] = await getWatchedMovies(user.uid);
      const watchedMovie: UserMovie | undefined = watchedMovies.find((m: UserMovie) => m.id === movieId);
      
      if (watchedMovie) {
      setWatched(true);
      setUserRating(watchedMovie.rating || 0);
      setUserReview(watchedMovie.review || '');
      }
    } catch (error: unknown) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  });

  // Load initial data
  useEffect(() => {
    fetchMovie(movieId);
    if (user) {
      fetchUserData();
    }
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
      Alert.alert('Success', `${movie.title} added to your watchlist.`);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      Alert.alert('Error', 'Failed to add movie to watchlist.');
    }
  };

  const handleRemoveFromWatchlist = async () => {
    if (!user || !movie) return;
    
    try {
      await removeFromWatchlist(user.uid, movie.id);
      setInWatchlist(false);
      Alert.alert('Success', `${movie.title} removed from your watchlist.`);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      Alert.alert('Error', 'Failed to remove movie from watchlist.');
    }
  };

  const handleMarkAsWatched = () => {
    setRatingModalVisible(true);
  };

  const handleSaveRating = async (rating: number, review: string) => {
    if (!user || !movie) return;
    
    try {
      if (watched) {
        // Update existing rating
        await updateMovieRating(user.uid, movie.id, rating, review);
      } else {
        // Add new watched movie with rating
        await addWatchedMovie(user.uid, {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
        }, rating, review);
        
        // Remove from watchlist if it was there
        if (inWatchlist) {
          setInWatchlist(false);
        }
      }
      
      setWatched(true);
      setUserRating(rating);
      setUserReview(review);
      setRatingModalVisible(false);
      
      Alert.alert('Success', `Rating saved for ${movie.title}.`);
    } catch (error) {
      console.error('Error saving rating:', error);
      Alert.alert('Error', 'Failed to save rating.');
    }
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Loading state
  if (movieLoading || userDataLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
          Loading movie details...
        </Text>
      </View>
    );
  }

  // Error state
  if (movieError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <ErrorDisplay 
          message="Failed to load movie details." 
          onRetry={() => fetchMovie(movieId)}
        />
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>Movie not found</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <NetworkStatusBar />
      
      <ScrollView>
        {/* Backdrop Image */}
        <View style={styles.backdropContainer}>
          <Image
            source={{
              uri: getImageUrl(movie.backdrop_path, 'original') || 
                   getImageUrl(movie.poster_path, 'original') ||
                   'https://via.placeholder.com/500x281?text=No+Image',
            }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
          <View style={[styles.backdropGradient, { backgroundColor: theme.backdrop }]} />
        </View>
        
        {/* Movie Info */}
        <View style={[styles.movieInfoContainer, { backgroundColor: theme.background }]}>
          <View style={styles.posterContainer}>
            <Image
              source={{
                uri: getImageUrl(movie.poster_path) || 
                     'https://via.placeholder.com/342x513?text=No+Image',
              }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          </View>
          
          <View style={styles.detailsContainer}>
            <Text style={[styles.title, { color: theme.text }]}>{movie.title}</Text>
            
            <View style={styles.yearRuntimeContainer}>
              <Text style={[styles.yearText, { color: theme.secondaryText }]}>
                {movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'}
              </Text>
              {movie.runtime > 0 && (
                <Text style={[styles.runtimeText, { color: theme.secondaryText }]}>
                  {formatRuntime(movie.runtime)}
                </Text>
              )}
            </View>
            
            <View style={styles.genreContainer}>
              {movie.genres.map((genre) => (
                <View key={genre.id} style={[styles.genreTag, { backgroundColor: theme.border }]}>
                  <Text style={[styles.genreText, { color: theme.text }]}>{genre.name}</Text>
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
        <View style={[styles.actionContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {watched ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAsWatched}
            >
              <Ionicons name="create-outline" size={24} color={theme.icon} />
              <Text style={[styles.actionText, { color: theme.text }]}>Update Rating</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAsWatched}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.icon} />
              <Text style={[styles.actionText, { color: theme.text }]}>Mark as Watched</Text>
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
        {watched && userRating > 0 && (
          <View style={[styles.userRatingContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.userRatingTitle, { color: theme.text }]}>Your Rating</Text>
            <RatingStars rating={userRating} size={24} />
            {userReview ? (
              <View style={[styles.userReviewContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.userReview, { color: theme.secondaryText }]}>"{userReview}"</Text>
              </View>
            ) : null}
          </View>
        )}
        
        {/* Overview */}
        <View style={[styles.overviewContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.overviewTitle, { color: theme.text }]}>Overview</Text>
          <Text style={[styles.overviewText, { color: theme.secondaryText }]}>
            {movie.overview || 'No overview available.'}
          </Text>
        </View>
      </ScrollView>
      
      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        initialRating={userRating}
        initialReview={userReview}
        movieTitle={movie.title}
        onClose={() => setRatingModalVisible(false)}
        onSave={handleSaveRating}
        isUpdate={watched}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backdropContainer: {
    position: 'relative',
    height: 220,
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  movieInfoContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  posterContainer: {
    width: 120,
    height: 180,
    marginRight: 16,
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  yearRuntimeContainer: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  voteCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userReviewContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  userReview: {
    fontSize: 14,
    fontStyle: 'italic',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overviewText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default MovieDetailScreen;