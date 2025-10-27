import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { NovoServico } from '@/pages/NovoServico'
import { Servicos } from '@/pages/Servicos'
import { EditarServico } from '@/pages/EditarServico'
import { Relatorios } from '@/pages/Relatorios'
import { Perfil } from '@/pages/Perfil'
import { useAuth } from '@/hooks/useAuth'
import { Loading } from '@/components/Loading'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

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
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/servicos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Servicos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/servicos/novo"
            element={
              <ProtectedRoute>
                <Layout>
                  <NovoServico />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/servicos/editar/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <EditarServico />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <Layout>
                  <Relatorios />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Layout>
                  <Perfil />
                </Layout>
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
