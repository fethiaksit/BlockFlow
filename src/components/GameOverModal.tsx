import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { COLORS, SIZES, SPACING } from '../theme';

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
    transform: [{ scale: SIZES.previewBaseScale + progress.value * SIZES.previewScaleDelta }, { translateY: (1 - progress.value) * SIZES.modalTranslateY }]
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
    backgroundColor: COLORS.backdrop
  },
  card: {
    width: '82%',
    backgroundColor: COLORS.panel,
    borderRadius: SIZES.radiusXxl,
    padding: SPACING.giant,
    alignItems: 'center'
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: SIZES.modalTitle,
    fontWeight: '800'
  },
  value: {
    color: COLORS.textPrimary,
    marginTop: SPACING.xxxl,
    fontSize: SIZES.modalValue,
    fontWeight: '700'
  },
  sub: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontSize: SIZES.bodyText
  },
  button: {
    marginTop: SIZES.invalidTextHeight,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.giant,
    paddingVertical: SPACING.xxl,
    borderRadius: SIZES.radiusLg
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.buttonText,
    fontWeight: '700'
  }
});
