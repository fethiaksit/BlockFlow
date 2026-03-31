import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/game';

type Props = {
  visible: boolean;
  score: number;
  highScore: number;
  onRestart: () => void;
};

export const GameOverModal = ({ visible, score, highScore, onRestart }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Oyun Bitti</Text>
          <Text style={styles.value}>Skor: {score}</Text>
          <Text style={styles.sub}>High Score: {highScore}</Text>
          <Pressable style={styles.button} onPress={onRestart}>
            <Text style={styles.buttonText}>Yeniden Başlat</Text>
          </Pressable>
        </View>
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
