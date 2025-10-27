import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loading } from '@/components/Loading'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}