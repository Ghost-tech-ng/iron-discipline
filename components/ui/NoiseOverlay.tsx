import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Filter, FeTurbulence, FeColorMatrix, Rect } from 'react-native-svg';

export function NoiseOverlay() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Filter id="grain" x="0%" y="0%" width="100%" height="100%">
            <FeTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <FeColorMatrix type="saturate" values="0" />
          </Filter>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          filter="url(#grain)"
          fill="white"
          opacity={0.035}
        />
      </Svg>
    </View>
  );
}
