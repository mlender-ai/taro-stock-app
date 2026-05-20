import React, { useState, useEffect } from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { getTickerLogoUrls, getTickerColor } from "../lib/tickerLogo";

interface Props {
  ticker: string;
  size?: number;
}

export function TickerLogo({ ticker, size = 32 }: Props) {
  const urls = getTickerLogoUrls(ticker, Math.max(size * 2, 128)); // 최소 128px
  const [urlIndex, setUrlIndex] = useState(0);
  const radius = size * 0.25;

  // ticker 변경 시 항상 첫 URL부터 재시도
  useEffect(() => {
    setUrlIndex(0);
  }, [ticker]);

  const currentUrl = urls[urlIndex] ?? null;

  if (!currentUrl) {
    return <Fallback ticker={ticker} size={size} radius={radius} />;
  }

  return (
    <Image
      source={{ uri: currentUrl }}
      style={{ width: size, height: size, borderRadius: radius }}
      onError={() => {
        const next = urlIndex + 1;
        setUrlIndex(next); // urls[next]가 없으면 null → Fallback
      }}
      resizeMode="contain"
    />
  );
}

function Fallback({ ticker, size, radius }: { ticker: string; size: number; radius: number }) {
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
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>
        {ticker.replace(/\.\w+$/, "").slice(0, 2).toUpperCase()}
      </Text>
    </View>
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
