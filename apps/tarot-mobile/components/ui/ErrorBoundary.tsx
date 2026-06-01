import React from "react";
import { View } from "react-native";
import { Text } from "./Text";
import { Colors } from "../../constants/theme";

interface Props {
  // 렌더 실패 시 보여줄 폴백 메시지
  fallbackMessage?: string;
  // 커스텀 폴백 노드 (지정 시 fallbackMessage 무시)
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// 자식 트리에서 발생한 렌더 에러를 잡아 폴백 UI로 대체하는 범용 에러 바운더리.
// 예: react-native-svg 네이티브 모듈 미등록 시 발생하는 <RNSVGSvgView> Unimplemented 에러.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[ErrorBoundary] caught:", error instanceof Error ? error.message : error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 32 }}>
          <Text variant="caption" color={Colors.midGrayText}>
            {this.props.fallbackMessage ?? "표시할 수 없습니다"}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}
