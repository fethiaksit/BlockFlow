import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

type SoundKey = 'click' | 'placement' | 'win' | 'gameOver';

const SOUND_ASSETS: Record<SoundKey, number> = {
  click: require('../../assets/audio/click.mp3'),
  placement: require('../../assets/audio/yerlestirme.mp3'),
  win: require('../../assets/audio/win.mp3'),
  gameOver: require('../../assets/audio/hata.mp3')
};

const SOUND_COOLDOWN_MS: Record<SoundKey, number> = {
  click: 90,
  placement: 140,
  win: 450,
  gameOver: 700
};

const sounds: Partial<Record<SoundKey, Audio.Sound>> = {};
const lastPlayedAt: Partial<Record<SoundKey, number>> = {};

let preloadPromise: Promise<void> | null = null;
let isLoaded = false;

const canPlaySound = (key: SoundKey) => {
  const now = Date.now();
  const cooldown = SOUND_COOLDOWN_MS[key];
  const lastPlayed = lastPlayedAt[key] ?? 0;

  if (now - lastPlayed < cooldown) {
    return false;
  }

  lastPlayedAt[key] = now;
  return true;
};

export const preloadSounds = async () => {
  if (isLoaded) {
    return;
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      staysActiveInBackground: false
    });

    for (const key of Object.keys(SOUND_ASSETS) as SoundKey[]) {
      const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[key], {
        shouldPlay: false,
        volume: 1
      });
      sounds[key] = sound;
    }

    isLoaded = true;
  })();

  try {
    await preloadPromise;
  } finally {
    preloadPromise = null;
  }
};

export const unloadSounds = async () => {
  const loadedSounds = Object.values(sounds);

  await Promise.all(
    loadedSounds.map(async (sound) => {
      if (!sound) return;
      await sound.unloadAsync();
    })
  );

  (Object.keys(sounds) as SoundKey[]).forEach((key) => {
    delete sounds[key];
  });

  isLoaded = false;
};

const playSound = async (key: SoundKey) => {
  if (!canPlaySound(key)) {
    return;
  }

  if (!isLoaded) {
    await preloadSounds();
  }

  const sound = sounds[key];
  if (!sound) {
    return;
  }

  try {
    await sound.replayAsync();
  } catch {
    // no-op: Ses hataları oyun akışını durdurmamalı.
  }
};

export const playClickSound = () => playSound('click');
export const playPlacementSound = () => playSound('placement');
export const playWinSound = () => playSound('win');
export const playGameOverSound = () => playSound('gameOver');
