import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/Loading'
import { Package, DollarSign, TrendingUp, Calendar, Plus, FileText, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

interface DashboardStats {
  totalServicos: number
  receitaTotal: number
  lucroTotal: number
  servicosEsteMes: number
}

// Componente que decide qual dashboard usar
export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadDashboardStats()
  }, [user])

  const loadDashboardStats = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data: servicos, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('usuario_id', user.id)

      if (error) throw error

      const totalServicos = servicos?.length || 0
      const receitaTotal = servicos?.reduce((sum, servico) => sum + servico.valor_total, 0) || 0
      const lucroTotal = servicos?.reduce((sum, servico) => sum + servico.lucro, 0) || 0

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const servicosEsteMes = servicos?.filter(servico => {
        const servicoDate = new Date(servico.created_at)
        return servicoDate.getMonth() === currentMonth && servicoDate.getFullYear() === currentYear
      }).length || 0

      setStats({
        totalServicos,
        receitaTotal,
        lucroTotal,
        servicosEsteMes
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      toast.error('Erro ao carregar estatísticas do dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu negócio</p>
        </div>
        <Link to="/servicos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalServicos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Serviços realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats?.receitaTotal.toFixed(2) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total faturado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats?.lucroTotal.toFixed(2) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Lucro líquido obtido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.servicosEsteMes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Serviços realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Novo Serviço
            </CardTitle>
            <CardDescription>
              Cadastre um novo serviço realizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/servicos/novo">
              <Button className="w-full">
                Cadastrar Serviço
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Listar Serviços
            </CardTitle>
            <CardDescription>
              Visualize e gerencie todos os serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/servicos">
              <Button variant="secondary" className="w-full">
                Ver Serviços
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Relatórios
            </CardTitle>
            <CardDescription>
              Analise o desempenho do seu negócio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/relatorios">
              <Button variant="secondary" className="w-full">
                Ver Relatórios
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}