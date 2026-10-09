import React, { useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useDragonBrain } from '../../hooks/useDragonBrain';
import { useDragonStore } from '../../store/dragonStore';
import type { DragonMood, DragonStage } from '../../utils/dragon';
import type { Eyes } from './DragonArt';
import { DragonSprite } from './DragonSprite';
import { DragonBubble } from './DragonBubble';
import { SparkBurst } from './SparkBurst';

interface Props {
  stage: DragonStage;
  mood: DragonMood;
  size: number;
  crack: number;
  /** Idle line to say now and then, or null to stay quiet. */
  nudge: string | null;
}

interface Bubble {
  id: number;
  text: string;
  big: boolean;
  side: 'left' | 'right';
}

function useEyes(mood: DragonMood): Eyes {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (mood === 'sleeping') return;
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      timer = setTimeout(() => {
        setBlink(true);
        timer = setTimeout(() => {
          setBlink(false);
          loop();
        }, 140);
      }, 2500 + Math.random() * 2500);
    };
    loop();
    return () => clearTimeout(timer);
  }, [mood]);
  if (mood === 'sleeping' || blink) return 'closed';
  return mood === 'sluggish' ? 'half' : 'open';
}

let nudgeSeq = -1;

export function DragonActor({ stage, mood, size, crack, nudge }: Props) {
  const { width } = useWindowDimensions();
  const { motion, celebrate } = useDragonBrain(stage, mood, size);
  const eyes = useEyes(mood);
  const cheer = useDragonStore((s) => s.cheer);
  // Cheers raised before this mounted (e.g. while hidden) are old news.
  const seen = useRef(useDragonStore.getState().cheer?.id ?? 0);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [burst, setBurst] = useState<{ id: number; big: boolean; dir: 1 | -1 } | null>(null);

  const say = (id: number, text: string, big: boolean) =>
    setBubble({ id, text, big, side: motion.x.value + size / 2 > width / 2 ? 'right' : 'left' });

  useEffect(() => {
    if (!cheer || cheer.id <= seen.current) return;
    seen.current = cheer.id;
    celebrate(cheer.big);
    say(cheer.id, cheer.text, cheer.big);
    setBurst({ id: cheer.id, big: cheer.big, dir: motion.facing.value >= 0 ? 1 : -1 });
  }, [cheer]);

  useEffect(() => {
    if (!nudge) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.4) setBubble((b) => b ?? { id: nudgeSeq--, text: nudge, big: false, side: motion.x.value + size / 2 > width / 2 ? 'right' : 'left' });
    }, 45000);
    return () => clearInterval(interval);
  }, [nudge, motion.x, size, width]);

  useEffect(() => {
    if (!bubble) return;
    const timer = setTimeout(() => setBubble((b) => (b?.id === bubble.id ? null : b)), bubble.big ? 2800 : 2200);
    return () => clearTimeout(timer);
  }, [bubble]);

  useEffect(() => {
    if (!burst) return;
    const timer = setTimeout(() => setBurst((b) => (b?.id === burst.id ? null : b)), 1000);
    return () => clearTimeout(timer);
  }, [burst]);

  return (
    <DragonSprite stage={stage} mood={mood} eyes={eyes} crack={crack} size={size} motion={motion}>
      {burst && <SparkBurst key={burst.id} stage={stage} size={size} dir={burst.dir} big={burst.big} />}
      {bubble && <DragonBubble key={bubble.id} text={bubble.text} big={bubble.big} side={bubble.side} size={size} />}
    </DragonSprite>
  );
}
