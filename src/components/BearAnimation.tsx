import React, { useEffect, useRef } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';

export type BearAnimationVariant = 
  | 'crossfade'          // Smooth crossfade with gentle alive float & breathing
  | 'slide'              // Dynamic slide transition from right to center
  | 'embedded-optimized' // Standalone embedded base64 (compressed, fast loading)
  | 'embedded-full';     // Standalone embedded base64 (lossless full resolution)

export type BearStage = 'eating' | 'reading' | 'raising_pr' | 'waving';

interface BearAnimationProps {
  variant?: BearAnimationVariant;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  onStageChange?: (stage: BearStage, frame: number) => void;
  onComplete?: () => void;
}

const VARIANT_FILES: Record<BearAnimationVariant, string> = {
  crossfade: '/main-bears/bear-transition.json',
  slide: '/main-bears/bear-slide-transition.json',
  'embedded-optimized': '/main-bears/bear-transition-embedded-optimized.json',
  'embedded-full': '/main-bears/bear-transition-embedded.json',
};

const STAGE_RANGES: { stage: BearStage; start: number; end: number }[] = [
  { stage: 'eating', start: 0, end: 75 },
  { stage: 'reading', start: 75, end: 150 },
  { stage: 'raising_pr', start: 150, end: 225 },
  { stage: 'waving', start: 225, end: 300 },
];

export const BearAnimation: React.FC<BearAnimationProps> = ({
  variant = 'crossfade',
  loop = true,
  autoplay = true,
  speed = 1.0,
  width = '100%',
  height = '100%',
  className = '',
  style = {},
  onStageChange,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const currentStageRef = useRef<BearStage | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing instance if any
    if (animRef.current) {
      animRef.current.destroy();
    }

    const animPath = VARIANT_FILES[variant];

    const instance = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      path: animPath,
    });

    instance.setSpeed(speed);
    animRef.current = instance;

    if (onStageChange) {
      instance.addEventListener('enterFrame', (e: { currentTime: number }) => {
        const frame = Math.round(e.currentTime);
        for (const r of STAGE_RANGES) {
          if (frame >= r.start && frame < r.end) {
            if (currentStageRef.current !== r.stage) {
              currentStageRef.current = r.stage;
              onStageChange(r.stage, frame);
            }
            break;
          }
        }
      });
    }

    if (onComplete) {
      instance.addEventListener('complete', () => {
        onComplete();
      });
    }

    return () => {
      instance.destroy();
    };
  }, [variant, loop, autoplay]);

  useEffect(() => {
    if (animRef.current) {
      animRef.current.setSpeed(speed);
    }
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    />
  );
};

export default BearAnimation;
