import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import type { ColorScheme } from '../../constants/theme';
import type { DragonStage } from '../../utils/dragon';

export type Eyes = 'open' | 'half' | 'closed';

interface Palette {
  body: string;
  belly: string;
  heat: string;
  ink: string;
  glint: string;
  wing: string;
}

export function dragonPalette(C: ColorScheme, stage: DragonStage): Palette {
  const damascus = stage === 'dragon';
  return {
    body: damascus ? C.accent2 : C.accent,
    belly: C.cream,
    heat: C.accentHeat,
    ink: C.shadow,
    glint: C.onAccent,
    wing: damascus ? C.accent : C.accentHeat,
  };
}

/** Where fire comes out and where the wing hinges, as fractions of the sprite box (facing right). */
export const MOUTH: Record<DragonStage, { x: number; y: number }> = {
  egg: { x: 0.5, y: 0.14 },
  hatchling: { x: 0.9, y: 0.46 },
  drake: { x: 0.95, y: 0.3 },
  dragon: { x: 0.95, y: 0.3 },
};
export const WING_PIVOT: Record<DragonStage, { x: number; y: number }> = {
  egg: { x: 0.5, y: 0.5 },
  hatchling: { x: 0.44, y: 0.55 },
  drake: { x: 0.46, y: 0.5 },
  dragon: { x: 0.46, y: 0.5 },
};

function Eye({ cx, cy, r, eyes, p }: { cx: number; cy: number; r: number; eyes: Eyes; p: Palette }) {
  if (eyes === 'closed') {
    return <Path d={`M${cx - r} ${cy} Q${cx} ${cy + r * 0.8} ${cx + r} ${cy}`} stroke={p.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
  }
  if (eyes === 'half') {
    return <Path d={`M${cx - r} ${cy} A${r} ${r} 0 0 0 ${cx + r} ${cy} Z`} fill={p.ink} />;
  }
  return (
    <>
      <Circle cx={cx} cy={cy} r={r} fill={p.ink} />
      <Circle cx={cx + r * 0.35} cy={cy - r * 0.35} r={r * 0.33} fill={p.glint} />
    </>
  );
}

function EggArt({ p, crack }: { p: Palette; crack: number }) {
  return (
    <>
      <Ellipse cx={50} cy={56} rx={30} ry={38} fill={p.belly} stroke={p.ink} strokeWidth={3} />
      <Ellipse cx={37} cy={46} rx={6} ry={8} fill={p.body} opacity={0.85} />
      <Ellipse cx={63} cy={68} rx={8} ry={6} fill={p.body} opacity={0.85} />
      <Circle cx={58} cy={34} r={4} fill={p.body} opacity={0.85} />
      <Circle cx={42} cy={78} r={3.5} fill={p.heat} opacity={0.8} />
      {crack > 0.3 && <Path d="M50 19 L45 29 L52 35 L46 44" stroke={p.ink} strokeWidth={2.4} fill="none" strokeLinejoin="round" />}
      {crack > 0.6 && <Path d="M79 54 L70 57 L74 63 L66 66" stroke={p.ink} strokeWidth={2.4} fill="none" strokeLinejoin="round" />}
      {crack > 0.85 && <Path d="M24 60 L32 62 L29 69" stroke={p.ink} strokeWidth={2.4} fill="none" strokeLinejoin="round" />}
    </>
  );
}

function HatchlingArt({ p, eyes }: { p: Palette; eyes: Eyes }) {
  return (
    <>
      <Path d="M28 70 Q10 74 8 58 Q16 66 30 62 Z" fill={p.body} />
      <Ellipse cx={46} cy={66} rx={22} ry={20} fill={p.body} />
      <Ellipse cx={51} cy={70} rx={13} ry={12} fill={p.belly} />
      <Path d="M52 26 L49 11 L59 23 Z" fill={p.belly} />
      <Path d="M67 24 L72 10 L74 26 Z" fill={p.belly} />
      <Circle cx={63} cy={41} r={20} fill={p.body} />
      <Ellipse cx={79} cy={47} rx={10} ry={7.5} fill={p.body} />
      <Circle cx={85} cy={45} r={1.6} fill={p.ink} />
      <Ellipse cx={58} cy={50} rx={4} ry={2.5} fill={p.heat} opacity={0.7} />
      <Eye cx={67} cy={38} r={5.5} eyes={eyes} p={p} />
      <Path
        d="M22 80 L29 73 L35 80 L41 73 L47 80 L53 73 L59 80 L65 73 L72 80 Q70 97 47 97 Q24 97 22 80 Z"
        fill={p.belly}
        stroke={p.ink}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
    </>
  );
}

function DrakeArt({ p, eyes, damascus }: { p: Palette; eyes: Eyes; damascus: boolean }) {
  return (
    <>
      <Path d="M30 66 Q12 72 6 56 Q4 50 8 46 Q10 56 20 58 Q28 60 34 58 Z" fill={p.body} />
      <Path d="M8 46 L1 39 L13 41 Z" fill={p.wing} />
      <Path d="M36 72 L33 87 L42 87 L43 73 Z" fill={p.body} />
      <Path d="M52 72 L52 87 L61 87 L58 71 Z" fill={p.body} />
      <Ellipse cx={44} cy={62} rx={21} ry={15} fill={p.body} />
      <Ellipse cx={48} cy={67} rx={13} ry={8} fill={p.belly} />
      <Path d="M54 54 Q62 40 66 30 L77 34 Q71 47 63 61 Z" fill={p.body} />
      <Path d="M68 21 L59 6 L72 17 Z" fill={p.belly} />
      <Path d="M74 19 L72 4 L79 17 Z" fill={p.belly} />
      <Ellipse cx={74} cy={28} rx={12} ry={9} fill={p.body} />
      <Path d="M80 23 Q95 25 95 31 Q91 36 80 34 Z" fill={p.body} />
      <Circle cx={90} cy={27} r={1.4} fill={p.ink} />
      <Eye cx={77} cy={25} r={3.3} eyes={eyes} p={p} />
      {damascus && (
        <>
          <Path d="M28 50 L32 41 L36 49 Z M38 47 L42 37 L46 46 Z M48 47 L52 38 L55 48 Z" fill={p.wing} />
          <Path d="M27 58 Q35 53 43 58 T60 58" stroke={p.belly} strokeWidth={1.6} fill="none" opacity={0.55} />
          <Path d="M29 64 Q36 60 43 64 T58 64" stroke={p.belly} strokeWidth={1.4} fill="none" opacity={0.4} />
          <Path d="M65 14 L66 8 L70 12 L74 6 L76 13" stroke={p.heat} strokeWidth={2} fill="none" strokeLinejoin="round" />
        </>
      )}
    </>
  );
}

export function DragonBody({ stage, eyes, crack, p }: { stage: DragonStage; eyes: Eyes; crack: number; p: Palette }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      {stage === 'egg' && <EggArt p={p} crack={crack} />}
      {stage === 'hatchling' && <HatchlingArt p={p} eyes={eyes} />}
      {(stage === 'drake' || stage === 'dragon') && <DrakeArt p={p} eyes={eyes} damascus={stage === 'dragon'} />}
    </Svg>
  );
}

export function DragonWing({ stage, p }: { stage: DragonStage; p: Palette }) {
  if (stage === 'egg') return null;
  const d =
    stage === 'hatchling'
      ? 'M44 55 Q36 36 22 39 Q29 45 27 53 Q35 51 44 58 Z'
      : 'M46 50 Q40 18 18 10 Q25 23 21 30 Q30 30 29 39 Q38 38 40 49 Z';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Path d={d} fill={p.wing} stroke={p.ink} strokeWidth={1.6} strokeLinejoin="round" />
      {stage !== 'hatchling' && <Path d="M44 46 L24 18 M42 47 L25 31 M41 49 L31 39" stroke={p.ink} strokeWidth={1} opacity={0.45} />}
    </Svg>
  );
}
