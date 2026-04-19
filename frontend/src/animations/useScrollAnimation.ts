import React, { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';

/**
 * Hook for scroll-based reveal animations
 * Elements animate in when they come into view
 */
export const useScrollAnimation = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return { ref, isInView };
};

/**
 * Hook for parallax scroll effect
 * Creates depth effect as you scroll
 */
export const useParallax = (speed: number = 0.5) => {
  const ref = useRef(null);

  return {
    ref,
    style: {
      y: `calc(var(--scroll-y, 0) * ${speed})`,
    },
  };
};

/**
 * Hook for animated numbers counting up
 */
export const useAnimatedNumber = (target: number, duration: number = 1000) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setDisplayValue(Math.floor(progress * target));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [target, duration]);

  return displayValue;
};
