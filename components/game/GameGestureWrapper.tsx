import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Direction } from './types';

interface Props {
  onMove: (direction: Direction) => void;
  children: React.ReactNode;
}

export const GameGestureWrapper: React.FC<Props> = ({ onMove, children }) => {
  const startPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Wrap onMove to safely call from gesture handler
  const handleMove = useCallback((direction: Direction) => {
    onMove(direction);
  }, [onMove]);

  // Use Pan gesture to detect swipes
  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      startPos.current = { x: event.x, y: event.y };
      hasMoved.current = false;
    })
    .onUpdate((event) => {
      'worklet';
      // Only trigger once per swipe
      if (hasMoved.current) return;

      const deltaX = event.translationX;
      const deltaY = event.translationY;

      // Very low threshold for snappy response (15 pixels)
      const threshold = 15;

      // Determine primary direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          hasMoved.current = true;
          if (deltaX > 0) {
            runOnJS(handleMove)('right');
          } else {
            runOnJS(handleMove)('left');
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          hasMoved.current = true;
          if (deltaY > 0) {
            runOnJS(handleMove)('down');
          } else {
            runOnJS(handleMove)('up');
          }
        }
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
