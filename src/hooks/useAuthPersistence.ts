import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

/**
 * This hook handles auth persistence with AsyncStorage
 * as a workaround for Firebase's React Native persistence
 */
export function useAuthPersistence(
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void
) {
  useEffect(() => {
    // Key for storing the auth state
    const AUTH_PERSISTENCE_KEY = '@ReelPick:auth';

    // Check for cached auth
    const checkCachedAuth = async () => {
      try {
        const cachedAuth = await AsyncStorage.getItem(AUTH_PERSISTENCE_KEY);
        
        if (cachedAuth) {
          // If we have cached auth data, we'll wait for Firebase to validate
          // via onAuthStateChanged before considering the user logged in
          setLoading(true);
        }
      } catch (error) {
        console.error('Error checking cached auth:', error);
      }
    };

    // Run once on component mount
    checkCachedAuth();

    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      try {
        if (user) {
          // Store minimal auth info when user is logged in
          await AsyncStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify({
            uid: user.uid,
            email: user.email,
            timestamp: Date.now()
          }));
        } else {
          // Clear auth data when user is logged out
          await AsyncStorage.removeItem(AUTH_PERSISTENCE_KEY);
        }
      } catch (error) {
        console.error('Error with auth persistence:', error);
      }
      
      setLoading(false);
    });

    // Clean up the listener
    return unsubscribe;
  }, [setUser, setLoading]);
}