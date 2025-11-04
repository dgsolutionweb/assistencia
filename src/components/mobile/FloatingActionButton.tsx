import React from 'react'
import clsx from 'clsx'

interface FloatingActionButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  tooltip?: string
  color?: string
  disabled?: boolean
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ icon, onClick, tooltip, color, disabled }) => {
  return (
    <button
      aria-label={tooltip || 'Ação'}
      className={clsx(
        'fixed bottom-6 right-6 h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg transition',
        color || 'bg-blue-600 hover:bg-blue-700',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </button>
  )
}

export default FloatingActionButton