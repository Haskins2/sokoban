import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Direction } from './types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onMove: (direction: Direction) => void;
}

export const Dpad: React.FC<Props> = ({ onMove }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => onMove('up')} style={styles.button}>
          <Ionicons name="caret-up" size={32} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => onMove('left')} style={styles.button}>
          <Ionicons name="caret-back" size={32} color="white" />
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity onPress={() => onMove('right')} style={styles.button}>
          <Ionicons name="caret-forward" size={32} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => onMove('down')} style={styles.button}>
          <Ionicons name="caret-down" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 60,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  spacer: {
    width: 60,
    height: 60,
    margin: 5,
  },
});
