import { StyleSheet, Text, View } from 'react-native';
import { MoveScoreBreakdown } from '../game/types';
import { COLORS, SIZES, SPACING } from '../theme';

type Props = {
  score: number;
  highScore: number;
  lastMove: MoveScoreBreakdown | null;
};

export const ScoreHeader = ({ score, highScore, lastMove }: Props) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.label}>Skor</Text>
        <Text style={styles.value}>{score}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>En Yüksek</Text>
        <Text style={styles.value}>{highScore}</Text>
      </View>
      <View style={[styles.card, styles.moveCard]}>
        <Text style={styles.label}>Son Hamle</Text>
        {lastMove ? (
          <Text style={styles.moveText}>
            +{lastMove.total} (Blok {lastMove.blockPoints}
            {lastMove.clearedLines > 0 ? ` + Temizleme ${lastMove.linePoints} + Bonus ${lastMove.multiBonus}` : ''})
          </Text>
        ) : (
          <Text style={styles.moveText}>Hamle bekleniyor</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    marginBottom: SPACING.xxl
  },
  card: {
    backgroundColor: COLORS.panel,
    borderRadius: SIZES.radiusXl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
    minWidth: SIZES.minScoreCardWidth
  },
  moveCard: {
    flex: 1
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: SIZES.smallText,
    marginBottom: SPACING.xs
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: SIZES.score,
    fontWeight: '700'
  },
  moveText: {
    color: COLORS.textPrimary,
    fontSize: SIZES.smallText,
    fontWeight: '600'
  }
});
