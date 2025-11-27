import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { LevelConfig, GameState } from './types';

const IMAGES = {
  wall: require('../../assets/soko_images/wall.png'),
  floor: require('../../assets/soko_images/floor.png'),
  box: require('../../assets/soko_images/box.png'),
};

interface Props {
  level: LevelConfig;
  gameState: GameState;
}

export const SokobanBoard: React.FC<Props> = ({ level, gameState }) => {
  const { width, height } = level;
  
  // Calculate tile size to fit screen
  const screenWidth = Dimensions.get('window').width;
  const maxTileWidth = (screenWidth - 40) / width; // 20px padding on each side
  const tileSize = Math.min(maxTileWidth, 50); // Cap at 50px

  const renderTile = (x: number, y: number) => {
    const isWall = level.walls.some(w => w.x === x && w.y === y);
    const isBox = gameState.boxes.some(b => b.x === x && b.y === y);
    const isPlayer = gameState.player.x === x && gameState.player.y === y;
    const isGoal = level.goals.some(g => g.x === x && g.y === y);

    let content = null;

    if (isPlayer) {
      content = <View style={[styles.player, { width: tileSize * 0.6, height: tileSize * 0.6, borderRadius: tileSize * 0.3 }]} />;
    } else if (isBox) {
      content = <Image source={IMAGES.box} style={{ width: tileSize, height: tileSize }} />;
    }

    return (
      <View key={`${x}-${y}`} style={{ width: tileSize, height: tileSize }}>
        <Image 
          source={isWall ? IMAGES.wall : IMAGES.floor} 
          style={{ width: tileSize, height: tileSize, position: 'absolute' }} 
        />
        {isGoal && !isWall && (
          <View style={[styles.centered, { width: tileSize, height: tileSize }]}>
            <View style={{ width: tileSize * 0.4, height: tileSize * 0.4, borderRadius: tileSize * 0.2, backgroundColor: '#4CAF50' }} />
          </View>
        )}
        {content && <View style={[styles.centered, { width: tileSize, height: tileSize }]}>{content}</View>}
      </View>
    );
  };

  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(renderTile(x, y));
    }
    rows.push(<View key={y} style={styles.row}>{row}</View>);
  }

  return (
    <View style={styles.container}>
      {rows}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  centered: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: {
    backgroundColor: 'red',
  },
});
