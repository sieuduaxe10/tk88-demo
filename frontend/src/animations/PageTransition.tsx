import React from 'react';
import { motion } from 'framer-motion';

/**
 * Page Transition Wrapper
 * Provides smooth fade and slide transitions between pages
 */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
}> = ({ children, direction = 'up', delay = 0 }) => {
  const directionVariants = {
    left: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 50 },
    },
    right: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 },
    },
    up: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 },
    },
    down: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 },
    },
  };

  const variants = directionVariants[direction];

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{
        duration: 0.4,
        delay,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Modal Transition Wrapper
 * For smooth modal/dialog animations
 */
export const ModalTransition: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean;
}> = ({ isOpen, onClose, children, closeOnBackdropClick = true }) => {
  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={closeOnBackdropClick ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

/**
 * Drawer Transition Wrapper
 * For smooth side drawer animations
 */
export const DrawerTransition: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
}> = ({ isOpen, onClose, children, side = 'left' }) => {
  const slideDirection = side === 'left' ? -100 : 100;

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, x: slideDirection }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 40,
            }}
            className={`fixed top-0 ${side}-0 h-screen z-50 bg-gray-800 shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

/**
 * Tooltip with Animation
 */
export const AnimatedTooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const positionVariants = {
    top: { y: -10 },
    bottom: { y: 10 },
    left: { x: -10 },
    right: { x: 10 },
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, ...positionVariants[position] }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, ...positionVariants[position] }}
          transition={{ duration: 0.2 }}
          className="absolute bg-gray-900 text-white text-sm px-3 py-2 rounded whitespace-nowrap"
        >
          {content}
        </motion.div>
      )}
    </div>
  );
};

/**
 * Expandable Section Animation
 */
export const AnimatedExpandable: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border border-gray-700 rounded">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex justify-between items-center hover:bg-gray-700/50 transition"
        whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.3)' }}
      >
        <span className="font-semibold">{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </motion.button>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        overflow="hidden"
      >
        <div className="p-4 border-t border-gray-700 bg-gray-800/30">{children}</div>
      </motion.div>
    </div>
  );
};

/**
 * Notification Toast with Animation
 */
export const AnimatedNotification: React.FC<{
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}> = ({ message, type = 'info', duration = 3000, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: 100 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 50, x: 100 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`${typeClasses[type]} text-white p-4 rounded shadow-lg flex items-center gap-3`}
    >
      <span className="text-lg font-bold">{icons[type]}</span>
      <span>{message}</span>
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="ml-auto"
      >
        ✕
      </motion.button>
    </motion.div>
  );
};
