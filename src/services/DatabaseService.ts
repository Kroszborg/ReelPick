import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../firebase';

// Types
export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
}

export interface Rating {
  movieId: number;
  rating: number;
  review?: string;
  date: Date;
}

export interface UserMovie extends Movie {
  rating?: number;
  review?: string;
  watchedDate?: Date;
}

// Ensure user document exists
const ensureUserDocument = async (userId: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create a basic user document if it doesn't exist
      await setDoc(userDocRef, {
        uid: userId,
        email: '',
        username: 'User',
        createdAt: new Date().toISOString(),
        watchedMovies: [],
        watchlist: []
      });
      console.log('Created missing user document:', userId);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring user document exists:', error);
    return false;
  }
};

// User functions
export const getUserData = async (userId: string) => {
  try {
    // Ensure user document exists
    await ensureUserDocument(userId);
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Watchlist functions
export const addToWatchlist = async (userId: string, movie: Movie) => {
  try {
    // Ensure user document exists
    await ensureUserDocument(userId);
    
    const userRef = doc(db, 'users', userId);
    
    // First check if the movie is already in the watchlist
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    if (userData && userData.watchlist) {
      const existingMovie = userData.watchlist.find((m: Movie) => m.id === movie.id);
      if (existingMovie) {
        return false; // Movie already in watchlist
      }
    }
    
    // Add movie to watchlist
    await updateDoc(userRef, {
      watchlist: arrayUnion(movie)
    });
    
    return true;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
};

export const removeFromWatchlist = async (userId: string, movieId: number) => {
  try {
    // Ensure user document exists
    await ensureUserDocument(userId);
    
    const userRef = doc(db, 'users', userId);
    
    // Get current watchlist
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    if (userData && userData.watchlist) {
      const updatedWatchlist = userData.watchlist.filter((movie: Movie) => movie.id !== movieId);
      
      // Update watchlist
      await updateDoc(userRef, {
        watchlist: updatedWatchlist
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
};

export const getWatchlist = async (userId: string) => {
  try {
    // Ensure user document exists
    await ensureUserDocument(userId);
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.watchlist || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error;
  }
};

// Watched movies and ratings
export const addWatchedMovie = async (userId: string, movie: Movie, rating: number, review?: string) => {
  try {
    // Ensure user document exists
    await ensureUserDocument(userId);
    
    const userRef = doc(db, 'users', userId);
    const watchedDate = new Date();
    
    // Add to user's watched movies
    await updateDoc(userRef, {
      watchedMovies: arrayUnion({
        ...movie,
        rating,
        review,
        watchedDate: watchedDate.toISOString()
      })
    });
    
    // Also add to ratings collection for recommendation engine
    await setDoc(doc(db, 'ratings', `${userId}_${movie.id}`), {
      userId,
      movieId: movie.id,
      movie: {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path
      },
      rating,
      review,
      timestamp: Timestamp.fromDate(watchedDate)
    });
    
    // Remove from watchlist if it exists there
    await removeFromWatchlist(userId, movie.id);
    
    return true;
  } catch (error) {
    console.error('Error saving rating:', error);
    throw error;
  }
};

export const updateMovieRating = async (userId: string, movieId: number, rating: number, review?: string) => {
  try {
    // Ensure user document exists
    await ensureUserDocument(userId);
    
    const userRef = doc(db, 'users', userId);
    
    // Get current watched movies
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    if (userData && userData.watchedMovies) {
      const updatedWatchedMovies = userData.watchedMovies.map((movie: UserMovie) => {
        if (movie.id === movieId) {
          return {
            ...movie,
            rating,
            review: review || movie.review
          };
        }
        return movie;
      });
      
      // Update watched movies
      await updateDoc(userRef, {
        watchedMovies: updatedWatchedMovies
      });
      
      // Also update in ratings collection
      const ratingRef = doc(db, 'ratings', `${userId}_${movieId}`);
      const ratingDoc = await getDoc(ratingRef);
      
      if (ratingDoc.exists()) {
        await updateDoc(ratingRef, {
          rating,
          review: review || null
        });
      } else {
        // Create the rating document if it doesn't exist
        const userMovieDoc = userData.watchedMovies.find((m: UserMovie) => m.id === movieId);
        
        if (userMovieDoc) {
          await setDoc(ratingRef, {
            userId,
            movieId,
            movie: {
              id: movieId,
              title: userMovieDoc.title,
              poster_path: userMovieDoc.poster_path
            },
            rating,
            review: review || null,
            timestamp: Timestamp.now()
          });
        }
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating movie rating:', error);
    throw error;
  }
};

export const getWatchedMovies = async (userId: string) => {
  try {
    // Ensure user document exists
    await ensureUserDocument(userId);
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.watchedMovies || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching watched movies:', error);
    throw error;
  }
};

// Simple recommendation engine
export const getRecommendedMovies = async (userId: string, limit = 10) => {
  try {
    // Ensure user document exists
    await ensureUserDocument(userId);
    
    // Strategy:
    // 1. Get user's highly rated movies (4-5 stars)
    // 2. Find users who also highly rated those movies
    // 3. Get movies those users rated highly that our user hasn't watched

    // Get user's watched movie IDs
    const userWatchedMovies = await getWatchedMovies(userId);
    const watchedMovieIds = userWatchedMovies.map((movie: UserMovie) => movie.id);
    
    // Get user's highly rated movies
    const highlyRatedMovies = userWatchedMovies.filter((movie: UserMovie) => movie.rating && movie.rating >= 4);
    
    if (highlyRatedMovies.length === 0) {
      // If user hasn't rated anything highly, get trending/popular instead
      // This would be handled through the TMDb API, so we return empty here
      return [];
    }
    
    // Find users with similar tastes
    const similarUsersSet = new Set<string>();
    
    for (const movie of highlyRatedMovies) {
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('movieId', '==', movie.id),
        where('rating', '>=', 4)
      );
      
      const querySnapshot = await getDocs(ratingsQuery);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== userId) {
          similarUsersSet.add(data.userId);
        }
      });
    }
    
    const similarUsers = Array.from(similarUsersSet);
    
    if (similarUsers.length === 0) {
      return [];
    }
    
    // Get movies those similar users rated highly
    const recommendedMoviesMap = new Map<number, Movie & { score: number }>();
    
    for (const similarUserId of similarUsers) {
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('userId', '==', similarUserId),
        where('rating', '>=', 4)
      );
      
      const querySnapshot = await getDocs(ratingsQuery);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Skip if user already watched this movie
        if (watchedMovieIds.includes(data.movieId)) {
          return;
        }
        
        // Add to recommendations with a score
        if (recommendedMoviesMap.has(data.movieId)) {
          const movie = recommendedMoviesMap.get(data.movieId)!;
          movie.score += data.rating;
          recommendedMoviesMap.set(data.movieId, movie);
        } else {
          recommendedMoviesMap.set(data.movieId, {
            ...data.movie,
            score: data.rating
          });
        }
      });
    }
    
    // Sort by score and return top recommendations
    const recommendations = Array.from(recommendedMoviesMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return recommendations;
  } catch (error) {
    console.error('Error getting recommended movies:', error);
    return [];
  }
};