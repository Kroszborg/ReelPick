// src/screens/social/UserProfileScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getUserProfile,
  getUserActivities,
  getFollowers,
  getFollowing,
  unfollowUser,
  sendFriendRequest,
  UserProfile,
  Activity,
} from "../../services/SocialService";
import ActivityItem from "../../components/social/ActivityItem";
import ErrorDisplay from "../../components/ErrorDisplay";

type UserProfileRouteParams = {
  userId: string;
};

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<Record<string, UserProfileRouteParams>, string>>();
  const { user } = useAuth();
  const { theme } = useTheme();

  const userId = route.params?.userId;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState<
    "none" | "following" | "follower" | "mutual" | "pending"
  >("none");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!userId || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Get user profile
      const profile = await getUserProfile(userId);
      if (!profile) {
        setError("User not found");
        return;
      }

      setUserProfile(profile);

      // Get recent activities
      const userActivities = await getUserActivities(userId);
      setActivities(userActivities);

      // Get followers and following
      const userFollowers = await getFollowers(userId);
      const userFollowing = await getFollowing(userId);

      setFollowers(userFollowers);
      setFollowing(userFollowing);

      // Determine relationship status
      const isFollowingUser = userFollowers.some((f) => f.uid === user.uid);
      const isFollowedByUser = userFollowing.some((f) => f.uid === user.uid);

      if (isFollowingUser && isFollowedByUser) {
        setRelationshipStatus("mutual");
      } else if (isFollowingUser) {
        setRelationshipStatus("follower");
      } else if (isFollowedByUser) {
        setRelationshipStatus("following");
      } else {
        // TODO: Check if there's a pending friend request
        setRelationshipStatus("none");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, user]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleFollow = async () => {
    if (!user || !userId || actionLoading) return;

    setActionLoading(true);

    try {
      await sendFriendRequest(user.uid, userId);
      setRelationshipStatus("pending");
    } catch (error) {
      console.error("Error sending friend request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user || !userId || actionLoading) return;

    setActionLoading(true);

    try {
      await unfollowUser(user.uid, userId);

      // Update relationship status
      if (relationshipStatus === "mutual") {
        setRelationshipStatus("follower");
      } else {
        setRelationshipStatus("none");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = () => {
    // TODO: Implement chat feature
    console.log("Message feature not implemented yet");
  };

  const renderActionButton = () => {
    if (!user || user.uid === userId) return null;

    switch (relationshipStatus) {
      case "following":
      case "mutual":
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.background }]}
            onPress={handleUnfollow}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.actionButtonText, { color: theme.text }]}>
                Following
              </Text>
            )}
          </TouchableOpacity>
        );

      case "pending":
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.background }]}
            disabled={true}
          >
            <Text
              style={[styles.actionButtonText, { color: theme.secondaryText }]}
            >
              Requested
            </Text>
          </TouchableOpacity>
        );

      default:
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleFollow}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Follow</Text>
            )}
          </TouchableOpacity>
        );
    }
  };

  const handleCommentPress = (activityId: string) => {
    navigation.navigate("ActivityDetail", { activityId });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Profile
          </Text>

          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !userProfile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Profile
          </Text>

          <View style={styles.placeholder} />
        </View>

        <ErrorDisplay
          message={error || "User not found"}
          onRetry={fetchProfileData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {userProfile.displayName || userProfile.username}
        </Text>

        <View style={styles.placeholder} />
      </View>

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
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.card }]}>
          <View style={styles.profileInfo}>
            {userProfile.photoURL ? (
              <Image
                source={{ uri: userProfile.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View
                style={[
                  styles.defaultAvatar,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text style={styles.avatarText}>
                  {userProfile.displayName?.[0] ||
                    userProfile.username?.[0] ||
                    "U"}
                </Text>
              </View>
            )}

            <View style={styles.nameContainer}>
              <Text style={[styles.displayName, { color: theme.text }]}>
                {userProfile.displayName || userProfile.username}
              </Text>

              <Text style={[styles.username, { color: theme.secondaryText }]}>
                @{userProfile.username}
              </Text>
            </View>

            {renderActionButton()}
          </View>

          {userProfile.bio && (
            <Text style={[styles.bio, { color: theme.text }]}>
              {userProfile.bio}
            </Text>
          )}

          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.stat}
              onPress={() =>
                navigation.navigate("FollowersList", {
                  userId: userProfile.uid,
                })
              }
            >
              <Text style={[styles.statValue, { color: theme.text }]}>
                {followers.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
                Followers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stat}
              onPress={() =>
                navigation.navigate("FollowingList", {
                  userId: userProfile.uid,
                })
              }
            >
              <Text style={[styles.statValue, { color: theme.text }]}>
                {following.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
                Following
              </Text>
            </TouchableOpacity>

            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {activities.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
                Activities
              </Text>
            </View>
          </View>
        </View>

        {/* Activities Section */}
        <View style={styles.activitiesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Activity
          </Text>

          {activities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="film-outline"
                size={40}
                color={theme.secondaryText}
              />
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                No recent activity
              </Text>
            </View>
          ) : (
            activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={{ ...activity, userProfile }}
                onCommentPress={() => handleCommentPress(activity.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Message button for followers/following */}
      {relationshipStatus === "mutual" && (
        <TouchableOpacity
          style={[styles.messageButton, { backgroundColor: theme.primary }]}
          onPress={handleMessage}
        >
          <Ionicons name="chatbubble" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  nameContainer: {
    flex: 1,
    marginLeft: 16,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "bold",
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  actionButtonText: {
    fontWeight: "bold",
    color: "#fff",
  },
  bio: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  activitiesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  messageButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
});

export default UserProfileScreen;
