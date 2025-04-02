import React from "react";
import { View, StyleSheet } from "react-native";
import BackButton from "./BackButton";

interface HeaderLeftProps {
  onPress?: () => void;
}

const HeaderLeft: React.FC<HeaderLeftProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <BackButton onPress={onPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
  },
});

export default HeaderLeft;
