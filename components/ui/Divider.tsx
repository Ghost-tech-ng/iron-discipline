import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
});
