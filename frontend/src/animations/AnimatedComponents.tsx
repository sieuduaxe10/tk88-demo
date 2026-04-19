import React from 'react';
import { motion } from 'framer-motion';
import {
  buttonHoverVariants,
  popInVariants,
  slideInVariants,
  itemVariants,
  fadeInVariants,
  glowVariants,
} from './variants';

/**
 * Animated Button Component
 * Smooth hover and click animations
 */
export const AnimatedButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}> = ({ children, onClick, disabled, className = '', variant = 'primary' }) => {
  const baseStyles = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <motion.button
      variants={buttonHoverVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      disabled={disabled}
      className={`font-bold py-2 px-4 rounded transition ${baseStyles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

/**
 * Animated Card Component
 * Fade in and hover lift effect
 */
export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverLift?: boolean;
}> = ({ children, className = '', onClick, hoverLift = true }) => {
  return (
    <motion.div
      variants={slideInVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverLift ? { y: -5 } : {}}
      onClick={onClick}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated Balance Display
 * Smooth number animation with color change on update
 */
export const AnimatedBalance: React.FC<{
  balance: number;
  previousBalance?: number;
}> = ({ balance, previousBalance = 0 }) => {
  const isIncreasing = balance > previousBalance;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-xs text-gray-400">Balance</div>
      <motion.div
        key={balance}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        className={`text-2xl font-bold transition-colors ${
          isIncreasing ? 'text-green-400' : 'text-yellow-400'
        }`}
      >
        ${balance.toFixed(2)}
      </motion.div>
    </motion.div>
  );
};

/**
 * Animated Result Display
 * Pop-in animation for game results
 */
export const AnimatedResult: React.FC<{
  result: string;
  payout: number;
  isWin: boolean;
}> = ({ result, payout, isWin }) => {
  return (
    <motion.div
      variants={popInVariants}
      initial="hidden"
      animate="visible"
      className={`p-4 rounded border ${
        isWin
          ? 'bg-green-900 border-green-600 text-green-100'
          : 'bg-red-900 border-red-600 text-red-100'
      }`}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.6 }}
        className="font-bold text-lg"
      >
        {isWin ? '🎉 WIN' : '❌ LOSE'}
      </motion.div>
      <div className="text-sm mt-2">{result}</div>
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-lg font-bold mt-2"
      >
        ${payout.toFixed(2)}
      </motion.div>
    </motion.div>
  );
};

/**
 * Animated Loading Spinner
 */
export const AnimatedSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={`border-4 border-gray-700 border-t-yellow-400 rounded-full ${sizeClasses[size]}`}
    />
  );
};

/**
 * Animated Stat Update
 * Highlight stat changes with color animation
 */
export const AnimatedStat: React.FC<{
  label: string;
  value: string | number;
  changed?: boolean;
}> = ({ label, value, changed = false }) => {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-gray-700 p-3 rounded"
    >
      <div className="text-xs text-gray-400">{label}</div>
      <motion.div
        animate={changed ? { scale: [1, 1.1, 1], color: ['#fff', '#f0ad4e', '#fff'] } : {}}
        transition={{ duration: 0.6 }}
        className="text-lg font-bold text-white"
      >
        {value}
      </motion.div>
    </motion.div>
  );
};

/**
 * Animated Tab Navigation
 */
export const AnimatedTabs: React.FC<{
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex space-x-4 border-b border-gray-700">
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-2 px-4 transition ${
            activeTab === tab.id
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-white'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {tab.label}
        </motion.button>
      ))}
    </div>
  );
};

/**
 * Animated Badge/Label
 */
export const AnimatedBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info';
}> = ({ children, variant = 'info' }) => {
  const variantClasses = {
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    danger: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${variantClasses[variant]}`}
    >
      {children}
    </motion.span>
  );
};

/**
 * Animated Alert/Toast
 */
export const AnimatedAlert: React.FC<{
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}> = ({ message, type = 'info', onClose }) => {
  const typeClasses = {
    success: 'bg-green-900 border-green-600 text-green-100',
    error: 'bg-red-900 border-red-600 text-red-100',
    warning: 'bg-yellow-900 border-yellow-600 text-yellow-100',
    info: 'bg-blue-900 border-blue-600 text-blue-100',
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded border ${typeClasses[type]}`}
    >
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="ml-4 font-bold"
        >
          ✕
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * Animated Glowing Box
 * For highlighting important elements
 */
export const AnimatedGlowBox: React.FC<{
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}> = ({ children, isActive = false, className = '' }) => {
  return (
    <motion.div
      variants={glowVariants}
      initial="initial"
      animate={isActive ? 'glow' : 'initial'}
      className={className}
    >
      {children}
    </motion.div>
  );
};
