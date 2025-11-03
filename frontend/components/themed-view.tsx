import { View, type ViewProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'card' | 'primary' | 'secondary' | 'accent';
};

export function ThemedView({ style, lightColor, darkColor, variant = 'default', ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <View 
      style={[
        { backgroundColor },
        variant === 'card' && styles.card,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'accent' && styles.accent,
        style
      ]} 
      {...otherProps} 
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    shadowColor: Colors.gunmetal,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primary: {
    backgroundColor: Colors.calPolyGreen,
  },
  secondary: {
    backgroundColor: Colors.celestialBlue,
  },
  accent: {
    backgroundColor: Colors.sandyBrown,
  }
});
