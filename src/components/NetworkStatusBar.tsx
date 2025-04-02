import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import NetInfo from "@react-native-community/netinfo";

const NetworkStatusBar: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const slideAnim = useState(new Animated.Value(-50))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);

      // Animate the status bar when connection state changes
      Animated.timing(slideAnim, {
        toValue: state.isConnected ? -50 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      unsubscribe();
    };
  }, [slideAnim]);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FF3B30",
    padding: 10,
    alignItems: "center",
    zIndex: 9999,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default NetworkStatusBar;
