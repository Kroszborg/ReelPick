import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";

interface PrivacySettings {
  showWatchHistory: boolean;
  showWatchlist: boolean;
  showRatings: boolean;
  allowFriendRequests: boolean;
  publicProfile: boolean;
  dataCollection: boolean;
}

const PrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    showWatchHistory: true,
    showWatchlist: true,
    showRatings: true,
    allowFriendRequests: true,
    publicProfile: false,
    dataCollection: true,
  });

  // Load privacy settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists() && userDoc.data().privacySettings) {
          setSettings(userDoc.data().privacySettings);
        }
      } catch (error) {
        console.error("Error loading privacy settings:", error);
        Alert.alert("Error", "Failed to load privacy settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Toggle a setting
  const toggleSetting = (key: keyof PrivacySettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save settings
  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        privacySettings: settings,
      });

      Alert.alert("Success", "Privacy settings updated", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      Alert.alert("Error", "Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              'All your data will be permanently lost. Please type "DELETE" to confirm.',
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Confirm",
                  style: "destructive",
                  // In a real app, implement account deletion logic here
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
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
            Privacy
          </Text>
          <View style={styles.rightPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Profile Privacy
          </Text>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Public Profile
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Allow anyone to view your profile
              </Text>
            </View>
            <Switch
              value={settings.publicProfile}
              onValueChange={() => toggleSetting("publicProfile")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Show Watch History
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Let others see movies you've watched
              </Text>
            </View>
            <Switch
              value={settings.showWatchHistory}
              onValueChange={() => toggleSetting("showWatchHistory")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Show Watchlist
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Let others see movies in your watchlist
              </Text>
            </View>
            <Switch
              value={settings.showWatchlist}
              onValueChange={() => toggleSetting("showWatchlist")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Show Ratings
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Let others see your movie ratings
              </Text>
            </View>
            <Switch
              value={settings.showRatings}
              onValueChange={() => toggleSetting("showRatings")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Social Privacy
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Allow Friend Requests
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Let others send you friend requests
              </Text>
            </View>
            <Switch
              value={settings.allowFriendRequests}
              onValueChange={() => toggleSetting("allowFriendRequests")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Data & Personalization
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Data Collection
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Allow collection of data for recommendations
              </Text>
            </View>
            <Switch
              value={settings.dataCollection}
              onValueChange={() => toggleSetting("dataCollection")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        <View style={[styles.dangerSection, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.deleteButtonText, { color: theme.error }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
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
  rightPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  section: {
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  dangerSection: {
    borderRadius: 8,
    margin: 16,
    marginBottom: 16,
    padding: 16,
  },
  deleteButton: {
    alignItems: "center",
    padding: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PrivacySettingsScreen;
