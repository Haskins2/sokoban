import { Dimensions, PixelRatio } from 'react-native';

// Design reference (iPhone 11/12/13)
const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const widthScale = SCREEN_WIDTH / DESIGN_WIDTH;
const heightScale = SCREEN_HEIGHT / DESIGN_HEIGHT;

/**
 * Scale based on screen width
 * Use for horizontal spacing, padding, widths
 */
export const scale = (size: number): number => {
  return PixelRatio.roundToNearestPixel(size * widthScale);
};

/**
 * Scale based on screen height
 * Use for vertical spacing, heights
 */
export const verticalScale = (size: number): number => {
  return PixelRatio.roundToNearestPixel(size * heightScale);
};

/**
 * Moderate scaling with factor (default 0.5)
 * Use for fonts, icons, and other elements where extreme scaling should be limited
 * Factor determines how much of the calculated scaling difference to apply
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor);
};

// Design tokens based on 8-point grid
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
} as const;

export const fontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  md: moderateScale(14),
  base: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(32),
} as const;

export const iconSize = {
  xs: moderateScale(16),
  sm: moderateScale(20),
  md: moderateScale(24),
  lg: moderateScale(30),
  xl: moderateScale(35),
  xxl: moderateScale(40),
} as const;
