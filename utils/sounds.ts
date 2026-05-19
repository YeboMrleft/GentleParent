import { Audio } from 'expo-av';

let clickSound: Audio.Sound | null = null;
let globalSoundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  globalSoundEnabled = enabled;
};

export const initSounds = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      shouldDuckAndroid: false,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/click.mp3'),
    );
    clickSound = sound;
  } catch (error) {
    console.log('Failed to load click sound:', error);
  }
};

export const playClickSound = async (enabled?: boolean) => {
  const shouldPlay = enabled !== undefined ? enabled : globalSoundEnabled;
  if (!shouldPlay) return;
  try {
    if (clickSound) {
      const status = await clickSound.getStatusAsync();
      if (status.isLoaded) {
        await clickSound.setPositionAsync(0);
        await clickSound.playAsync();
        return;
      }
    }
    // Sound not loaded — recreate it
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/click.mp3'),
      { shouldPlay: true },
    );
    clickSound = sound;
  } catch {
    // silently ignore
  }
};

export const unloadSounds = async () => {
  if (clickSound) {
    await clickSound.unloadAsync();
    clickSound = null;
  }
};