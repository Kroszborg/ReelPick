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
import BackButton from "../../components/BackButton";

interface NotificationSettings {
  newReleases: boolean;
  friendActivity: boolean;
  recommendations: boolean;
  movieUpdates: boolean;
  email: boolean;
  push: boolean;
}

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    newReleases: true,
    friendActivity: true,
    recommendations: true,
    movieUpdates: false,
    email: true,
    push: true,
  });

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists() && userDoc.data().notificationSettings) {
          setSettings(userDoc.data().notificationSettings);
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
        Alert.alert("Error", "Failed to load notification settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Toggle a setting
  const toggleSetting = (key: keyof NotificationSettings) => {
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
        notificationSettings: settings,
      });

      Alert.alert("Success", "Notification settings updated", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      Alert.alert("Error", "Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <BackButton />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Notifications
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

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Notification Types
          </Text>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Friend Activity
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Get notified when friends rate movies
              </Text>
            </View>
            <Switch
              value={settings.friendActivity}
              onValueChange={() => toggleSetting("friendActivity")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Recommendations
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Get movie recommendations based on your taste
              </Text>
            </View>
            <Switch
              value={settings.recommendations}
              onValueChange={() => toggleSetting("recommendations")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Movie Updates
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Updates about movies in your watchlist
              </Text>
            </View>
            <Switch
              value={settings.movieUpdates}
              onValueChange={() => toggleSetting("movieUpdates")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Notification Methods
          </Text>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Email Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Receive notifications via email
              </Text>
            </View>
            <Switch
              value={settings.email}
              onValueChange={() => toggleSetting("email")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Push Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: theme.secondaryText },
                ]}
              >
                Receive push notifications on your device
              </Text>
            </View>
            <Switch
              value={settings.push}
              onValueChange={() => toggleSetting("push")}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
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

export default NotificationSettingsScreen;
