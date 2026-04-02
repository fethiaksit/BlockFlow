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
