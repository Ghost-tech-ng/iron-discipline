import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  color: string;
}

export function AnvilIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7h13l5 2-6 2v2h-2l2 6H7l2-6H8v-2C5.5 11 3 9.5 3 7z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function DumbbellIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M8 7v10M16 7v10M20 9v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ChartIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 18l5-6 4 3 5-8 4 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={1.8} />
      <Path d="M7 12l3 3 7-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BoltIcon({ color, size = 26 }: IconProps & { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13.5 2L4 13.5h6.5L9.5 22 20 9.5h-6.5L13.5 2z" fill={color} />
    </Svg>
  );
}
