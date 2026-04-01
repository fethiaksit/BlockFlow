import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { COLORS } from '../constants/game';

type Props = {
  visible: boolean;
  score: number;
  highScore: number;
  onRestart: () => void;
};

export const GameOverModal = ({ visible, score, highScore, onRestart }: Props) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 220 });
  }, [progress, visible]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }, { translateY: (1 - progress.value) * 10 }]
  }));

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, animatedCardStyle]}>
          <Text style={styles.title}>Oyun Bitti</Text>
          <Text style={styles.value}>Skor: {score}</Text>
          <Text style={styles.sub}>High Score: {highScore}</Text>
          <Pressable style={styles.button} onPress={onRestart}>
            <Text style={styles.buttonText}>Yeniden Başlat</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)'
  },
  card: {
    width: '82%',
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center'
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800'
  },
  value: {
    color: COLORS.textPrimary,
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700'
  },
  sub: {
    color: COLORS.textSecondary,
    marginTop: 6,
    fontSize: 14
  },
  button: {
    marginTop: 18,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
