import React from "react";
import { ErrorBoundary } from "../ui/ErrorBoundary";

// Catches native SVG rendering errors (e.g. Unimplemented component: <RNSVGSvgView>)
// that occur when react-native-svg native module isn't registered in the current runtime.
export function ChartErrorBoundary({ children }: React.PropsWithChildren) {
  return <ErrorBoundary fallbackMessage="차트를 표시할 수 없습니다">{children}</ErrorBoundary>;
}
