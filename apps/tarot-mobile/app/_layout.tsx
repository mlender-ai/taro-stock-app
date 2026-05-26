import React from "react";
import { StyleSheet, View } from "react-native";
import { Colors } from "../constants/theme";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.layoutContainer}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  layoutContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    color: Colors.text,
  },
});
