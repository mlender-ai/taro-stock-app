import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

const FlameAnimation: React.FC = () => {
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateFlame = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(flameScale, {
              toValue: 1.2,
              duration: 700,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(flameOpacity, {
              toValue: 0.8,
              duration: 700,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(flameScale, {
              toValue: 1,
              duration: 700,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(flameOpacity, {
              toValue: 1,
              duration: 700,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animateFlame();
  }, [flameScale, flameOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.flame,
          {
            transform: [{ scale: flameScale }],
            opacity: flameOpacity,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: 100,
    height: 100,
  },
  flame: {
    width: 60,
    height: 60,
    backgroundColor: Colors.luminousReveal,
    borderRadius: 30,
    shadowColor: Colors.luminousReveal,
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
});

export default FlameAnimation;
