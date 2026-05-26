import React, { useEffect, useState } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Colors, Typography } from "../constants/theme";

type CardDrawingAnimationProps = {
  onComplete: () => void;
};

export const CardDrawingAnimation: React.FC<CardDrawingAnimationProps> = ({ onComplete }) => {
  const [countdown, setCountdown] = useState(3);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            onComplete();
          });
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown === 1) {
      playBellSound();
    }
  }, [countdown]);

  const playBellSound = () => {
    // Implement sound logic using Expo Audio API
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{countdown > 0 ? countdown : "Revealing..."}</Text>
      <Animated.View style={[styles.overlay, { opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  text: {
    fontSize: Typography.size.display,
    color: Colors.text,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.accent,
    zIndex: -1,
  },
});
