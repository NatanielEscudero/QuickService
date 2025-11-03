import { Platform } from 'react-native';

export const Colors = {
  calPolyGreen: '#2a4d14',
  lightGreen: '#a3f7b5',
  gunmetal: '#022b3a',
  celestialBlue: '#1e91d6',
  sandyBrown: '#f0a868',
  white: '#ffffff',
  
  light: {
    primary: '#2a4d14', // calPolyGreen
    secondary: '#1e91d6', // celestialBlue
    accent: '#f0a868', // sandyBrown
    background: '#a3f7b5', // lightGreen
    text: '#022b3a', // gunmetal
    surface: '#ffffff',
    error: '#d32f2f',
    warning: '#f0a868', // sandyBrown
    success: '#2a4d14', // calPolyGreen
  },
  
  dark: {
    primary: '#a3f7b5', // lightGreen
    secondary: '#1e91d6', // celestialBlue
    accent: '#f0a868', // sandyBrown
    background: '#022b3a', // gunmetal
    text: '#ffffff',
    surface: '#1a1a1a',
    error: '#ef5350',
    warning: '#f0a868', // sandyBrown
    success: '#a3f7b5', // lightGreen
  }
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
