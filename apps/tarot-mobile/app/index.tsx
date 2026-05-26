import React from "react";
import { View } from "react-native";
import { CardDrawingAnimation } from "../components/CardDrawingAnimation";

export default function HomeScreen() {
  const handleAnimationComplete = () => {
    console.log("Animation complete. Navigate to result screen.");
    // Add navigation logic here, e.g., navigation.navigate("ResultScreen");
  };

  return (
    <View>
      <CardDrawingAnimation onComplete={handleAnimationComplete} />
    </View>
  );
}
