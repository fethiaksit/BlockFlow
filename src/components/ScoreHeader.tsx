import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/game';
import { MoveScoreBreakdown } from '../game/types';

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
    gap: 8,
    marginBottom: 12
  },
  card: {
    backgroundColor: COLORS.panel,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 110
  },
  moveCard: {
    flex: 1
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 2
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700'
  },
  moveText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  }
});
