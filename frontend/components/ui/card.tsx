import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'outline' | 'flat';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'outline' && styles.outlineCard,
        variant === 'flat' && styles.flatCard,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: Colors.gunmetal,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  outlineCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.calPolyGreen,
    shadowColor: 'transparent',
    elevation: 0,
  },
  flatCard: {
    shadowColor: 'transparent',
    elevation: 0,
  },
});