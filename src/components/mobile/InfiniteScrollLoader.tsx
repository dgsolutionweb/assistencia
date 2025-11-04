import React from 'react'

interface InfiniteScrollLoaderProps {
  isLoading?: boolean
  hasMore?: boolean
  error?: any
}

export const InfiniteScrollLoader: React.FC<InfiniteScrollLoaderProps> = ({ isLoading, hasMore, error }) => {
  if (!isLoading && !hasMore) return null
  return (
    <div className="flex items-center justify-center py-4 text-sm text-gray-600">
      {isLoading ? 'Carregando mais...' : 'Puxe para carregar mais'}
    </div>
  )
}