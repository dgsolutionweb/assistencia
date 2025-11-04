import { useGesture } from '@use-gesture/react';
import { useSpring, SpringValue } from '@react-spring/web';
import { useMemo } from 'react';
import HapticService from '../lib/haptic';

export interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  enableHaptic?: boolean;
  swipeThreshold?: number;
  longPressDelay?: number;
}

export interface GestureStyles {
  x: SpringValue<number>;
  y: SpringValue<number>;
  scale: SpringValue<number>;
  opacity: SpringValue<number>;
}

export function useGestures(config: GestureConfig = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    enableHaptic = true,
    swipeThreshold = 50,
    longPressDelay = 500
  } = config;

  // Spring para animações
  const [springs, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    config: { tension: 300, friction: 30 }
  }));

  // Configuração dos gestos
  const bind = useGesture(
    {
      // Gesture de drag/swipe
      onDrag: ({ active, movement: [mx, my], direction: [dx, dy], velocity: [vx, vy] }) => {
        if (active) {
          // Animação durante o drag
          api.start({
            x: mx * 0.1, // Reduz o movimento para feedback sutil
            y: my * 0.1,
            scale: 0.98,
            opacity: 0.9
          });
        } else {
          // Reset após o drag
          api.start({
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1
          });

          // Detectar swipes baseado na velocidade e distância
          const isSwipe = Math.abs(mx) > swipeThreshold || Math.abs(my) > swipeThreshold;
          const isFastSwipe = Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5;

          if (isSwipe || isFastSwipe) {
            if (enableHaptic) {
              HapticService.light();
            }

            // Determinar direção do swipe
            if (Math.abs(mx) > Math.abs(my)) {
              // Swipe horizontal
              if (dx > 0 && onSwipeRight) {
                onSwipeRight();
              } else if (dx < 0 && onSwipeLeft) {
                onSwipeLeft();
              }
            } else {
              // Swipe vertical
              if (dy > 0 && onSwipeDown) {
                onSwipeDown();
              } else if (dy < 0 && onSwipeUp) {
                onSwipeUp();
              }
            }
          }
        }
      },

      // Gesture de pinch/zoom
      onPinch: ({ active, offset: [scale] }) => {
        if (onPinch) {
          onPinch(scale);
        }
        
        api.start({
          scale: active ? scale : 1
        });

        if (active && enableHaptic) {
          HapticService.light();
        }
      },

      // Gesture de tap
      onClick: ({ event }) => {
        event.preventDefault();
        
        if (enableHaptic) {
          HapticService.light();
        }

        // Animação de tap
        api.start({
          scale: 0.95,
          config: { tension: 400, friction: 20 }
        });

        setTimeout(() => {
          api.start({
            scale: 1,
            config: { tension: 400, friction: 20 }
          });
        }, 100);

        // Executar callback de tap
        if (onTap) {
          onTap();
        }
      },

      // Long press
      onPointerDown: ({ event }) => {
        if (onLongPress) {
          const timer = setTimeout(() => {
            if (enableHaptic) {
              HapticService.medium();
            }
            onLongPress();
          }, longPressDelay);

          const cleanup = () => {
            clearTimeout(timer);
            document.removeEventListener('pointerup', cleanup);
            document.removeEventListener('pointercancel', cleanup);
          };

          document.addEventListener('pointerup', cleanup);
          document.addEventListener('pointercancel', cleanup);
        }
      }
    },
    {
      drag: {
        filterTaps: true,
        rubberband: true
      },
      pinch: {
        scaleBounds: { min: 0.5, max: 3 },
        rubberband: true
      }
    }
  );

  // Funções de animação manual
  const animations = useMemo(() => ({
    // Animação de entrada
    slideIn: (direction: 'left' | 'right' | 'up' | 'down' = 'right') => {
      const initialX = direction === 'left' ? -100 : direction === 'right' ? 100 : 0;
      const initialY = direction === 'up' ? -100 : direction === 'down' ? 100 : 0;
      
      api.start({
        from: { x: initialX, y: initialY, opacity: 0 },
        to: { x: 0, y: 0, opacity: 1 }
      });
    },

    // Animação de saída
    slideOut: (direction: 'left' | 'right' | 'up' | 'down' = 'left') => {
      const finalX = direction === 'left' ? -100 : direction === 'right' ? 100 : 0;
      const finalY = direction === 'up' ? -100 : direction === 'down' ? 100 : 0;
      
      return api.start({
        to: { x: finalX, y: finalY, opacity: 0 }
      });
    },

    // Animação de bounce
    bounce: () => {
      api.start({
        scale: 1.1,
        config: { tension: 400, friction: 10 }
      });
      
      setTimeout(() => {
        api.start({
          scale: 1,
          config: { tension: 400, friction: 10 }
        });
      }, 150);
    },

    // Animação de shake
    shake: () => {
      const sequence = [
        { x: -10, config: { duration: 50 } },
        { x: 10, config: { duration: 50 } },
        { x: -10, config: { duration: 50 } },
        { x: 10, config: { duration: 50 } },
        { x: 0, config: { duration: 50 } }
      ];

      sequence.forEach((step, index) => {
        setTimeout(() => {
          api.start(step);
        }, index * 50);
      });
    },

    // Reset todas as animações
    reset: () => {
      api.start({
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1
      });
    }
  }), [api]);

  return {
    bind,
    springs,
    animations,
    api
  };
}

export default useGestures;