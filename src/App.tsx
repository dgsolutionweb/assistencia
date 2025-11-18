import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { NovoServico } from '@/pages/NovoServico'
import { Servicos } from '@/pages/Servicos'
import { EditarServico } from '@/pages/EditarServico'
import Pecas from '@/pages/Pecas'
import NovaPeca from '@/pages/NovaPeca'
import { Retiradas } from '@/pages/Retiradas'
import { NovaRetirada } from '@/pages/NovaRetirada'
import { Relatorios } from '@/pages/Relatorios'
import { Perfil } from '@/pages/Perfil'
import { useAuth } from '@/hooks/useAuth'
import { Loading } from '@/components/Loading'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  const AppLayout = Layout

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/servicos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Servicos />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/servicos/novo"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NovoServico />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/servicos/editar/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EditarServico />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pecas"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Pecas />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pecas/nova"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NovaPeca />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retiradas"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Retiradas />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retiradas/nova"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NovaRetirada />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Relatorios />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Perfil />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
