// Re-export react-native-svg components with React 19 compatible types.
// react-native-svg 15.x ships class-component types that conflict with
// React 19's JSX namespace. This module re-exports them as "any" typed
// components so TypeScript stops complaining while the upstream fix lands.

/* eslint-disable @typescript-eslint/no-explicit-any */
import RNSvg, {
  Path as RNPath,
  Defs as RNDefs,
  LinearGradient as RNLinearGradient,
  Stop as RNStop,
  Rect as RNRect,
  Circle as RNCircle,
  Line as RNLine,
  G as RNG,
  Text as RNSvgText,
} from "react-native-svg";

export const Svg = RNSvg as any;
export const Path = RNPath as any;
export const Defs = RNDefs as any;
export const LinearGradient = RNLinearGradient as any;
export const Stop = RNStop as any;
export const Rect = RNRect as any;
export const Circle = RNCircle as any;
export const Line = RNLine as any;
export const G = RNG as any;
export const SvgText = RNSvgText as any;
