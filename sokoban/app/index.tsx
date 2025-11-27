import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SokobanBoard } from '@/components/game/SokobanBoard';
import { Dpad } from '@/components/game/Dpad';
import { useSokoban } from '@/components/game/useSokoban';
import { LevelConfig } from '@/components/game/types';

const INITIAL_LEVEL: LevelConfig = {
  width: 5,
  height: 5,
  walls: [
    // Top row
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
    // Bottom row
    { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
    // Left column (excluding corners)
    { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
    // Right column (excluding corners)
    { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 },
  ],
  boxes: [
    { x: 2, y: 2 },
  ],
  goals: [
    { x: 2, y: 3 },
  ],
  initialPlayer: { x: 2, y: 1 },
};

export default function HomeScreen() {
  const { gameState, move, reset, isWon } = useSokoban(INITIAL_LEVEL);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sokoban</Text>
      <View style={styles.gameContainer}>
        <SokobanBoard level={INITIAL_LEVEL} gameState={gameState} />
      </View>
      {isWon && <Text style={styles.winText}>You Win!</Text>}
      <Dpad onMove={move} />
      <TouchableOpacity onPress={reset} style={styles.resetButton}>
        <Text style={styles.resetButtonText}>Reset Level</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  gameContainer: {
    marginBottom: 20,
  },
  winText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  resetButton: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
