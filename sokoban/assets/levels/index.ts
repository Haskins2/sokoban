import level1 from './level_1.json';
import { LevelConfig } from '@/components/game/types';
import level3 from './level_3.json';
import level4 from './level_4.json';

export const LEVELS: LevelConfig[] = [
  level1 as LevelConfig,
  // Add more levels here:
  // require('./level_2.json'),
  level3 as LevelConfig,
  level4 as LevelConfig,
];
