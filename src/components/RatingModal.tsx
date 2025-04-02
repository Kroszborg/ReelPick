import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import RatingStars from "./RatingStars";

interface RatingModalProps {
  visible: boolean;
  initialRating?: number;
  initialReview?: string;
  movieTitle?: string;
  onClose: () => void;
  onSave: (rating: number, review: string) => void;
  isUpdate?: boolean;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  initialRating = 0,
  initialReview = "",
  movieTitle = "",
  onClose,
  onSave,
  isUpdate = false,
}) => {
  const { theme } = useTheme();
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);

  // Reset state when modal opens with new values
  useEffect(() => {
    if (visible) {
      setRating(initialRating);
      setReview(initialReview);
    }
  }, [visible, initialRating, initialReview]);

  const handleSave = () => {
    onSave(rating, review);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={[styles.overlay, { backgroundColor: theme.modalBackground }]}
          >
            <View style={[styles.container, { backgroundColor: theme.card }]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {isUpdate ? "Update Rating" : "Rate This Movie"}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.icon} />
                </TouchableOpacity>
              </View>

              {/* Movie title if provided */}
              {movieTitle ? (
                <Text style={[styles.movieTitle, { color: theme.text }]}>
                  {movieTitle}
                </Text>
              ) : null}

              {/* Rating section */}
              <View style={styles.ratingSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Your Rating
                </Text>
                <RatingStars
                  rating={rating}
                  size={36}
                  interactive={true}
                  onRatingChange={setRating}
                />
              </View>

              {/* Review section */}
              <View style={styles.reviewSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Your Review (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.reviewInput,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Share your thoughts about the movie..."
                  placeholderTextColor={theme.secondaryText}
                  value={review}
                  onChangeText={setReview}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>

              {/* Action buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { backgroundColor: theme.background },
                  ]}
                  onPress={onClose}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.saveButton,
                    {
                      backgroundColor:
                        rating > 0 ? theme.primary : theme.secondaryText,
                      opacity: rating > 0 ? 1 : 0.7,
                    },
                  ]}
                  onPress={handleSave}
                  disabled={rating === 0}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 16,
    textAlign: "center",
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default RatingModal;
