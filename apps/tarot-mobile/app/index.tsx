import React from 'react';
import { View, StyleSheet } from 'react-native';
import CardSpread from '../components/CardSpread';

const App: React.FC = () => {
  return (
    <View style={styles.container}>
      <CardSpread />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

export default App;
