import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';

export function Divider() {
  const Colors = useColors();
  const styles = React.useMemo(() => StyleSheet.create({
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border,
      marginVertical: 12,
    },
  }), [Colors]);

  return <View style={styles.divider} />;
}
