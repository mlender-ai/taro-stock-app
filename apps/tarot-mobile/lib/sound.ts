import { Audio } from "expo-av";

export async function playBellSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/sounds/bell.mp3")
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate(undefined); // Clear playback status listener
    return () => {
      sound.unloadAsync(); // Properly unload the sound
    };
  } catch (error) {
    console.error("Failed to play sound", error);
  }
}
