import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  highlight?: string;
  gradient: string;
  icon: string;
  ctaLabel?: string;
  ctaOnClick?: () => void;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  intervalMs?: number;
  className?: string;
  height?: string;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  slides,
  intervalMs = 5000,
  className,
  height = 'h-56 sm:h-72 md:h-80',
}) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % slides.length),
    [slides.length],
  );
  const prev = () =>
    setIndex((i) => (i - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timer.current = setInterval(next, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, intervalMs, next, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index];

  return (
    <div
      className={clsx(
        'relative w-full overflow-hidden rounded-xl shadow-card-hover ring-1 ring-casino-gold/20',
        height,
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80) next();
            else if (info.offset.x > 80) prev();
          }}
          className={clsx(
            'absolute inset-0 bg-gradient-to-br',
            slide.gradient,
          )}
        >
          <div className="absolute inset-0 opacity-30 mix-blend-overlay">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-black blur-2xl" />
          </div>

          <div className="relative h-full flex items-center px-6 sm:px-10 md:px-14">
            <div className="flex-1 max-w-xl">
              {slide.highlight && (
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block bg-casino-gold text-black font-black text-xs px-3 py-1 rounded-full uppercase mb-3"
                >
                  {slide.highlight}
                </motion.div>
              )}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-lg"
              >
                {slide.title}
              </motion.h2>
              {slide.subtitle && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm sm:text-base text-white/90 mt-2 max-w-md"
                >
                  {slide.subtitle}
                </motion.p>
              )}
              {slide.ctaLabel && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={slide.ctaOnClick}
                  className="mt-5 bg-casino-gold text-black font-black px-6 py-2.5 rounded-full uppercase tracking-wide shadow-gold-glow"
                >
                  {slide.ctaLabel} →
                </motion.button>
              )}
            </div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 0.9, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="hidden sm:block text-[120px] md:text-[180px] drop-shadow-2xl select-none"
            >
              {slide.icon}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur transition z-10"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur transition z-10"
            aria-label="Next"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={clsx(
                  'transition-all h-1.5 rounded-full',
                  i === index
                    ? 'bg-casino-gold w-8'
                    : 'bg-white/40 w-1.5 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroCarousel;
