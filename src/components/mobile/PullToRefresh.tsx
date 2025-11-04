import React from 'react'

interface PullToRefreshProps {
  isRefreshing?: boolean
  pullDistance?: number
  canRefresh?: boolean
  refreshProgress?: number
  children: React.ReactNode
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  isRefreshing,
  pullDistance = 0,
  canRefresh,
  refreshProgress,
  children
}) => {
  return (
    <div className="relative">
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center text-sm text-gray-600"
        style={{ height: pullDistance }}
      >
        {isRefreshing ? 'Atualizando...' : canRefresh ? 'Solte para atualizar' : 'Puxe para atualizar'}
        {typeof refreshProgress === 'number' && (
          <span className="ml-2">{Math.round(refreshProgress * 100)}%</span>
        )}
      </div>
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  )
}