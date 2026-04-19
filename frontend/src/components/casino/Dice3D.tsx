import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Single 3D die using CSS preserve-3d. 6 faces labeled 1-6 with pip dots.
 * When `rolling=true`: continuously rotates. When false: snaps to show `value` face.
 */
const FACE_ROTATIONS: Record<number, string> = {
  1: 'rotateY(0deg)',
  6: 'rotateY(180deg)',
  2: 'rotateY(-90deg)',
  5: 'rotateY(90deg)',
  3: 'rotateX(-90deg)',
  4: 'rotateX(90deg)',
};

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [25, 25],
    [75, 75],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [25, 25],
    [25, 75],
    [75, 25],
    [75, 75],
  ],
  5: [
    [25, 25],
    [25, 75],
    [50, 50],
    [75, 25],
    [75, 75],
  ],
  6: [
    [25, 25],
    [25, 50],
    [25, 75],
    [75, 25],
    [75, 50],
    [75, 75],
  ],
};

const DieFace: React.FC<{ value: number; transform: string }> = ({ value, transform }) => (
  <div
    className="absolute inset-0 rounded-lg bg-gradient-to-br from-white via-slate-100 to-slate-300 border border-slate-400 shadow-inner"
    style={{ transform, backfaceVisibility: 'hidden' }}
  >
    {PIPS[value].map(([x, y], i) => (
      <div
        key={i}
        className="absolute rounded-full bg-red-700 shadow-md"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: '18%',
          height: '18%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    ))}
  </div>
);

export const Die: React.FC<{
  value: number;
  rolling: boolean;
  delay?: number;
  size?: number;
  /** Z-rotation in degrees when settled — lets dice look naturally scattered. */
  tilt?: number;
}> = ({ value, rolling, delay = 0, size = 54, tilt = 0 }) => {
  const half = size / 2;
  const settled = FACE_ROTATIONS[value] ?? FACE_ROTATIONS[1];

  return (
    <div
      style={{
        width: size,
        height: size,
        perspective: 800,
      }}
      className="relative"
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={
          rolling
            ? {
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 360, 720, 1080],
                rotateZ: 0,
                y: [0, -18, 8, 0],
              }
            : { rotateX: 0, rotateY: 0, rotateZ: tilt, y: 0 }
        }
        transition={
          rolling
            ? {
                duration: 1.6,
                ease: 'linear',
                repeat: Infinity,
                delay,
              }
            : { duration: 0.4, type: 'spring', stiffness: 120 }
        }
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: rolling ? 'none' : settled,
          }}
        >
          <DieFace value={1} transform={`translateZ(${half}px)`} />
          <DieFace value={6} transform={`rotateY(180deg) translateZ(${half}px)`} />
          <DieFace value={2} transform={`rotateY(90deg) translateZ(${half}px)`} />
          <DieFace value={5} transform={`rotateY(-90deg) translateZ(${half}px)`} />
          <DieFace value={3} transform={`rotateX(90deg) translateZ(${half}px)`} />
          <DieFace value={4} transform={`rotateX(-90deg) translateZ(${half}px)`} />
        </div>
      </motion.div>
      {/* Ground shadow */}
      <motion.div
        className="absolute left-1/2 -bottom-1 w-8 h-1.5 rounded-full bg-black/50 blur-sm"
        animate={{ scale: rolling ? [1, 0.6, 1] : 1 }}
        transition={{ duration: 1.6, repeat: rolling ? Infinity : 0, delay }}
        style={{ transform: 'translateX(-50%)' }}
      />
    </div>
  );
};

/**
 * Tài Xỉu bowl: 3 dice stacked pyramid (2 bottom + 1 top), covered by a single
 * red-and-gold lid. User drags the lid UP (or taps) to peek. Lid flies off,
 * all 3 dice revealed at once.
 */
export const DiceBowl: React.FC<{
  values: [number, number, number];
  rolling: boolean;
  onAllPeeked?: () => void;
  onPeekSound?: () => void;
}> = ({ values, rolling, onAllPeeked, onPeekSound }) => {
  const [revealed, setRevealed] = useState(false);
  const [flyTo, setFlyTo] = useState<{ x: number; y: number; rot: number }>({
    x: 0,
    y: -280,
    rot: -22,
  });

  useEffect(() => {
    if (rolling) setRevealed(false);
  }, [rolling]);

  // Compute fly-off trajectory in the direction the user dragged.
  const peel = (dx = 0, dy = -260) => {
    if (rolling || revealed) return;
    const mag = Math.hypot(dx, dy) || 1;
    const dist = 320;
    const x = (dx / mag) * dist;
    const y = (dy / mag) * dist;
    const rot = Math.max(-45, Math.min(45, (dx / 10) + (dy < 0 ? -15 : 15)));
    setFlyTo({ x, y, rot });
    onPeekSound?.();
    setRevealed(true);
    setTimeout(() => onAllPeeked?.(), 620);
  };

  const canPeel = !rolling && !revealed;

  return (
    <div className="relative">
      {/* Glass bowl */}
      <div className="relative w-[260px] h-[200px] rounded-b-[120px] rounded-t-3xl border-4 border-white/20 bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm shadow-[inset_0_0_40px_rgba(255,255,255,0.1)] overflow-visible">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-3xl" />
        <div className="absolute top-4 left-6 w-16 h-20 bg-white/15 rounded-full blur-xl" />

        {/* Pyramid dice: 1 on top, 2 on bottom — spacious layout, scattered tilt */}
        <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-6 pointer-events-none">
          <Die value={values[0]} rolling={rolling} delay={0} size={62} tilt={-9} />
          <div className="flex gap-9">
            <Die value={values[1]} rolling={rolling} delay={0.1} size={62} tilt={14} />
            <Die value={values[2]} rolling={rolling} delay={0.2} size={62} tilt={-16} />
          </div>
        </div>

        {/* Lid container — flex-centers the motion.div so its x-position
            stays put even while Framer Motion animates y/rotate/scale. */}
        <div
          className="absolute inset-x-0 flex justify-center"
          style={{ top: 12, pointerEvents: canPeel ? 'auto' : 'none' }}
        >
          <motion.div
            drag={canPeel}
            dragConstraints={{ top: -240, bottom: 240, left: -240, right: 240 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              const dist = Math.hypot(info.offset.x, info.offset.y);
              const speed = Math.hypot(info.velocity.x, info.velocity.y);
              if (dist > 55 || speed > 500) peel(info.offset.x, info.offset.y);
            }}
            onClick={canPeel ? () => peel(0, -260) : undefined}
            initial={{ x: 0, y: -280, opacity: 0, scale: 0.7, rotate: -10 }}
            animate={
              rolling
                ? { x: 0, y: -280, opacity: 0, scale: 0.7, rotate: -10 }
                : revealed
                ? {
                    x: flyTo.x,
                    y: flyTo.y,
                    opacity: 0,
                    scale: 0.6,
                    rotate: flyTo.rot,
                  }
                : { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }
            }
            transition={
              rolling
                ? { duration: 0.25 }
                : revealed
                ? { duration: 0.6, ease: [0.45, 0, 0.2, 1] }
                : { duration: 0.7, type: 'spring', stiffness: 200, damping: 13 }
            }
            whileHover={canPeel ? { scale: 1.03 } : undefined}
            whileTap={canPeel ? { scale: 0.97 } : undefined}
            className={clsx(
              'relative select-none',
              canPeel ? 'cursor-grab active:cursor-grabbing' : '',
            )}
            style={{
              width: 220,
              height: 175,
              borderRadius: '45% 45% 100px 100px',
              background:
                'radial-gradient(ellipse at 35% 25%, #fecaca 0%, #dc2626 25%, #991b1b 60%, #450a0a 100%)',
              border: '4px solid #fbbf24',
              boxShadow:
                '0 10px 24px rgba(0,0,0,0.65), inset 0 6px 14px rgba(255,255,255,0.25), inset 0 -10px 18px rgba(0,0,0,0.55)',
            }}
          >
            {/* Gold knob */}
            <div className="absolute left-1/2 -translate-x-1/2 top-3 flex flex-col items-center">
              <motion.div
                className="w-10 h-10 rounded-full bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 border-2 border-yellow-100 shadow-[0_3px_8px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)]"
                animate={canPeel ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="w-14 h-2 mt-0.5 rounded-full bg-gradient-to-b from-yellow-600 to-yellow-900 shadow-inner" />
            </div>

            {/* Silk pattern */}
            <div
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                borderRadius: 'inherit',
                backgroundImage:
                  'repeating-linear-gradient(45deg, rgba(255,215,0,0.18) 0 3px, transparent 3px 8px)',
              }}
            />

            {/* Vietnamese lucky character */}
            <div className="absolute inset-x-0 bottom-10 text-center text-yellow-300 text-2xl font-black drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
              福
            </div>

            {/* Hint label */}
            <div className="absolute inset-x-0 bottom-3 text-center text-yellow-200 text-[10px] font-black tracking-[0.2em] uppercase">
              {canPeel ? '✋ KÉO ĐI ĐỂ NẶN' : ''}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto w-[300px] h-3 rounded-full bg-gradient-to-b from-yellow-800 to-yellow-950 shadow-md -mt-1" />

      {/* Hint below */}
      <div className="mt-2 text-center min-h-[20px]">
        {rolling ? (
          <span className="text-[11px] text-yellow-300/80 animate-pulse">
            🎲 Đang xóc bát…
          </span>
        ) : !revealed ? (
          <span className="text-[11px] text-yellow-300/90 font-semibold">
            Úp chén rồi! Kéo mọi hướng hoặc chạm để nặn 🫳
          </span>
        ) : null}
      </div>
    </div>
  );
};
