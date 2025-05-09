/**
 * Tedlist App Theme
 * Standardized colors and styling for consistent UI
 */

export const COLORS = {
  // Primary palette
  primary: '#4EDBC3', // Mint teal (main brand color)
  primaryDark: '#1A9B84', // Darker teal for buttons/accents
  primaryLight: '#E0F8F4', // Light mint for card backgrounds
  
  // Secondary colors
  secondary: '#FFDC5E', // Sunny yellow for CTA buttons
  secondaryDark: '#EABD38', // Darker yellow
  secondaryLight: '#FFF8E0', // Light yellow background
  
  // Text colors
  text: '#195B50', // Dark teal text
  textSecondary: '#4A6964', // Medium teal text
  textLight: '#6D8D88', // Lighter text for subtitles
  
  // UI colors
  background: '#4EDBC3', // Main app background
  cardBackground: '#E0F8F4', // Card backgrounds
  border: '#BFE8E2', // Light border color
  divider: '#D0F0EB', // Dividers between content
  
  // Status colors
  success: '#55D6BE', // Success green
  error: '#FF7878', // Error red
  warning: '#FFD166', // Warning yellow
  info: '#6AC4F9', // Info blue
  
  // Interaction colors
  highlight: '#38EEF9', // Highlight blue for selections
  disabled: '#C5E0DB', // Disabled state

  // Neutral colors
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#DADADA',
  darkGray: '#8F8F8F',
  black: '#333333',
};

export const SHADOWS = {
  small: {
    shadowColor: '#195B50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#195B50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#195B50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
};

export const FONT = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 999, // Fully rounded (for buttons, etc.)
};

export default {
  COLORS,
  SHADOWS,
  FONT,
  SPACING,
  BORDER_RADIUS,
};
