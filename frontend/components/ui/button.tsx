import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'success';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({ 
  onPress, 
  title, 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  style,
  textStyle
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return '#ccc';
    switch (variant) {
      case 'primary':
        return Colors.calPolyGreen;
      case 'secondary':
        return Colors.celestialBlue;
      case 'accent':
        return Colors.sandyBrown;
      case 'danger':
        return '#DC3545';
      case 'success':
        return Colors.calPolyGreen;
      case 'outline':
        return 'transparent';
      default:
        return Colors.calPolyGreen;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      switch (variant) {
        case 'primary':
          return Colors.calPolyGreen;
        case 'secondary':
          return Colors.celestialBlue;
        case 'accent':
          return Colors.sandyBrown;
        case 'danger':
          return '#DC3545';
        case 'success':
          return Colors.calPolyGreen;
        default:
          return Colors.calPolyGreen;
      }
    }
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return getBorderColor();
    }
    return variant === 'accent' ? Colors.gunmetal : Colors.white;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[
          styles.text, 
          { color: getTextColor() },
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});