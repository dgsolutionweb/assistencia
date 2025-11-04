import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

// Animações de entrada padrão
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2, ease: 'easeOut' }
};

// Componente de página animada
interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Botão com animações suaves
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}: AnimatedButtonProps) {
  const baseClasses = 'relative overflow-hidden rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center"
          >
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Carregando...
          </motion.div>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Card com animações
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function AnimatedCard({ 
  children, 
  className = '', 
  hover = true,
  delay = 0 
}: AnimatedCardProps) {
  return (
    <motion.div
      className={`bg-white rounded-lg shadow-md p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } : undefined}
    >
      {children}
    </motion.div>
  );
}

// Lista animada
interface AnimatedListProps {
  children: React.ReactNode[];
  className?: string;
  stagger?: number;
}

export function AnimatedList({ 
  children, 
  className = '',
  stagger = 0.1 
}: AnimatedListProps) {
  return (
    <motion.div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * stagger }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Modal animado
interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function AnimatedModal({ 
  isOpen, 
  onClose, 
  children, 
  title 
}: AnimatedModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>
              )}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Toast animado
interface AnimatedToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function AnimatedToast({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3000
}: AnimatedToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-500 text-white'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${typeStyles[type]}`}
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex items-center justify-between">
            <span>{message}</span>
            <button
              onClick={onClose}
              className="ml-2 text-current opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Progress bar animado
interface AnimatedProgressProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export function AnimatedProgress({ 
  progress, 
  className = '',
  showPercentage = true 
}: AnimatedProgressProps) {
  const constrainedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showPercentage && (
          <span className="text-sm text-gray-600">{Math.round(constrainedProgress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-blue-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${constrainedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Skeleton loader animado
interface AnimatedSkeletonProps {
  className?: string;
  lines?: number;
}

export function AnimatedSkeleton({ 
  className = '', 
  lines = 1 
}: AnimatedSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="bg-gray-200 rounded h-4 mb-2 last:mb-0"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );
}