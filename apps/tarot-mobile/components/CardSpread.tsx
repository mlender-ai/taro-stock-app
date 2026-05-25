import React from 'react';
import { View, StyleSheet } from 'react-native';
import Card from './Card'; // Assuming a Card component exists
import FlameAnimation from './CardAnimation';

const CardSpread: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Card cardId="the-fool" />
        <FlameAnimation />
      </View>
      <View style={styles.cardContainer}>
        <Card cardId="the-magician" />
        <FlameAnimation />
      </View>
      <View style={styles.cardContainer}>
        <Card cardId="the-high-priestess" />
        <FlameAnimation />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  cardContainer: {
    marginHorizontal: 8,
    alignItems: 'center',
  },
});

export default CardSpread;
