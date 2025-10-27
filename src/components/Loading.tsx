export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="text-gray-600">Carregando...</span>
      </div>
    </div>
  )
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-red-600 ${sizeClasses[size]}`} />
  )
}