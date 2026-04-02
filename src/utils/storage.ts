import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/game';

export const loadHighScore = async (): Promise<number> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.highScore);
  if (!value) return 0;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const saveHighScore = async (score: number) => {
  await AsyncStorage.setItem(STORAGE_KEYS.highScore, String(score));
};

export const loadSoundEnabled = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.soundEnabled);

  if (value === null) {
    return true;
  }

  return value === '1';
};

export const saveSoundEnabled = async (enabled: boolean) => {
  await AsyncStorage.setItem(STORAGE_KEYS.soundEnabled, enabled ? '1' : '0');
};
