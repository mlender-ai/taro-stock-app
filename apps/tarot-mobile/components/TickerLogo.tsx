import React, { useState } from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { getTickerLogoUrl, getTickerColor } from "../lib/tickerLogo";

interface Props {
  ticker: string;
  size?: number;
}

export function TickerLogo({ ticker, size = 32 }: Props) {
  const [failed, setFailed] = useState(false);
  const url = getTickerLogoUrl(ticker, size * 2); // 2x for retina
  const radius = size * 0.25;

  if (!url || failed) {
    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: getTickerColor(ticker),
          },
        ]}
      >
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
          {ticker.replace(/\.\w+$/, "").slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius: radius }}
      onError={() => setFailed(true)}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: -0.5,
  },
});
