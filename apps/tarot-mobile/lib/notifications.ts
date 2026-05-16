import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

// 알림 핸들러 설정 (앱 포그라운드 시)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // 실제 기기에서만 동작
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // 기존 권한 확인
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 권한 요청
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Android 채널 설정
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "기본 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7c5cbf",
    });
  }

  // 프로젝트 ID를 사용하여 Expo 푸시 토큰 획득
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.log("Project ID not found for push notifications");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenData.data;
}

// 딥링크 알림 처리
export function getNotificationDeepLink(
  notification: Notifications.Notification
): string | null {
  const data = notification.request.content.data;
  if (data?.drawId) {
    return `/history/${data.drawId}`;
  }
  if (data?.ticker) {
    return `/`; // 홈에서 검색으로
  }
  return null;
}
