import React, { useRef, useState } from 'react'
import clsx from 'clsx'
import HapticService from '@/lib/haptic'

export type SwipeAction = {
  icon: React.ReactNode
  color?: string
  action?: () => void
}

export interface TouchableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated'
  hapticFeedback?: boolean
  swipeActions?: {
    left?: SwipeAction
    right?: SwipeAction
  }
  children: React.ReactNode
}

// Minimal mobile card with optional haptics and basic swipe detection
const TouchableCard: React.FC<TouchableCardProps> = ({
  variant = 'default',
  hapticFeedback = false,
  swipeActions,
  className,
  children,
  onClick,
  ...rest
}) => {
  const touchStartX = useRef<number | null>(null)
  const [swiped, setSwiped] = useState<'left' | 'right' | null>(null)

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (swiped && swipeActions) {
      if (swiped === 'left' && swipeActions.left?.action) swipeActions.left.action()
      if (swiped === 'right' && swipeActions.right?.action) swipeActions.right.action()
      setSwiped(null)
    }
    touchStartX.current = null
  }

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current == null) return
    const dx = e.touches[0].clientX - touchStartX.current
    if (dx > 50) setSwiped('right')
    else if (dx < -50) setSwiped('left')
  }

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (hapticFeedback) HapticService.light()
    onClick?.(e)
  }

  return (
    <div
      className={clsx(
        'rounded-xl border bg-white',
        variant === 'elevated' ? 'shadow-md' : 'shadow-sm',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </div>
  )
}

export default TouchableCard