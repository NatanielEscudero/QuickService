import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({ text, variant = 'default', style, textStyle }: BadgeProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return Colors.calPolyGreen + '20';
      case 'warning':
        return Colors.sandyBrown + '20';
      case 'error':
        return '#DC354520';
      case 'info':
        return Colors.celestialBlue + '20';
      default:
        return Colors.gunmetal + '20';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return Colors.calPolyGreen;
      case 'warning':
        return Colors.sandyBrown;
      case 'error':
        return '#DC3545';
      case 'info':
        return Colors.celestialBlue;
      default:
        return Colors.gunmetal;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});