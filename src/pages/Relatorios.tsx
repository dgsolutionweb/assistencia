import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/Loading'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Servico } from '@/lib/supabase'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  Target,
  Lightbulb,
  Activity,
  Percent,
  Package,
  Users,
  Clock,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import TouchableCard from '../components/mobile/TouchableCard'
import FloatingActionButton from '../components/mobile/FloatingActionButton'
import { useMobile } from '../hooks/useMobile'
import { HapticService } from '../services/HapticService'

interface RelatorioResumo {
  totalServicos: number
  receitaTotal: number
  lucroTotal: number
  ticketMedio: number
  margemLucro: number
  totalPecas: number
  servicosEsteMes: number
  servicosPorStatus: {
    concluido: number
    pendente: number
    cancelado: number
  }
}

// Mobile Reports Component
const MobileRelatorios: React.FC<{
  loading: boolean
  resumo: RelatorioResumo | null
  filtroInicio: string
  filtroFim: string
  setFiltroInicio: (value: string) => void
  setFiltroFim: (value: string) => void
  definirPeriodoAtual: () => void
  limparFiltros: () => void
  exportarRelatorio: () => void
  handleRefresh: () => void
  refreshing: boolean
}> = ({
  loading,
  resumo,
  filtroInicio,
  filtroFim,
  setFiltroInicio,
  setFiltroFim,
  definirPeriodoAtual,
  limparFiltros,
  exportarRelatorio,
  handleRefresh,
  refreshing
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="pb-6">
      {/* Mobile Header */}
      <div className="px-4 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white -mx-4 -mt-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Relatórios</h1>
            <p className="text-blue-100">Análise financeira do seu negócio</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Period Filters - Mobile */}
      <div className="px-4 mb-6 space-y-4">
        <TouchableCard variant="elevated" className="p-4">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Filtros de Período</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filtroInicio}
                  onChange={(e) => setFiltroInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filtroFim}
                  onChange={(e) => setFiltroFim(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  HapticService.trigger('light');
                  definirPeriodoAtual();
                }}
                className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
              >
                <Calendar className="w-4 h-4 mr-1 inline" />
                Este Mês
              </button>
              <button
                onClick={() => {
                  HapticService.trigger('light');
                  limparFiltros();
                }}
                className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
              >
                Limpar
              </button>
            </div>
          </div>
        </TouchableCard>
      </div>

      {/* Summary Cards - Mobile Layout */}
      {resumo ? (
        <div className="px-4 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <TouchableCard variant="elevated" className="p-4" hapticFeedback>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{resumo.totalServicos}</div>
                <div className="text-xs text-gray-500">Serviços</div>
              </div>
            </TouchableCard>

            <TouchableCard variant="elevated" className="p-4" hapticFeedback>
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-600">R$ {resumo.receitaTotal.toFixed(0)}</div>
                <div className="text-xs text-gray-500">Receita</div>
              </div>
            </TouchableCard>
          </div>

          <TouchableCard variant="elevated" className="p-4" hapticFeedback>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Lucro Total</div>
                <div className="text-2xl font-bold text-green-600">R$ {resumo.lucroTotal.toFixed(2)}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </TouchableCard>

          <div className="grid grid-cols-2 gap-4">
            <TouchableCard variant="elevated" className="p-4" hapticFeedback>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-lg font-bold text-purple-600">R$ {resumo.ticketMedio.toFixed(0)}</div>
                <div className="text-xs text-gray-500">Ticket Médio</div>
              </div>
            </TouchableCard>

            <TouchableCard variant="elevated" className="p-4" hapticFeedback>
              <div className="text-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Percent className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-lg font-bold text-orange-600">{resumo.margemLucro.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Margem</div>
              </div>
            </TouchableCard>
          </div>
        </div>
      ) : (
        <div className="px-4 mb-6">
          <TouchableCard variant="elevated" className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum dado encontrado
            </h3>
            <p className="text-gray-500">
              Não há serviços no período selecionado
            </p>
          </TouchableCard>
        </div>
      )}

      {/* Performance Analysis - Mobile */}
      {resumo && (
        <div className="px-4 space-y-4 mb-6">
          <TouchableCard variant="elevated" className="p-4">
            <div className="flex items-center mb-4">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Análise de Performance</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  Receita Média Mensal
                </span>
                <span className="font-bold text-blue-600">
                  R$ {(resumo.receitaTotal / Math.max(1, new Date().getMonth() + 1)).toFixed(0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">
                  Lucro por Serviço
                </span>
                <span className="font-bold text-green-600">
                  R$ {resumo.totalServicos > 0 ? (resumo.lucroTotal / resumo.totalServicos).toFixed(2) : '0,00'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-800">
                  Eficiência Operacional
                </span>
                <span className="font-bold text-purple-600">
                  {resumo.margemLucro > 50 ? 'Excelente' : resumo.margemLucro > 30 ? 'Boa' : 'Regular'}
                </span>
              </div>
            </div>
          </TouchableCard>

          <TouchableCard variant="elevated" className="p-4">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Recomendações</h3>
            </div>
            
            <div className="space-y-3">
              {resumo.margemLucro < 30 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Margem de lucro baixa:</strong> Considere revisar os preços ou reduzir custos das peças.
                  </p>
                </div>
              )}
              
              {resumo.ticketMedio < 100 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Ticket médio baixo:</strong> Explore oportunidades de serviços adicionais ou premium.
                  </p>
                </div>
              )}

              {resumo.totalServicos < 10 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Volume baixo:</strong> Considere estratégias de marketing para aumentar a demanda.
                  </p>
                </div>
              )}

              {resumo.margemLucro > 50 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Excelente performance!</strong> Continue mantendo a qualidade e considere expandir os serviços.
                  </p>
                </div>
              )}
            </div>
          </TouchableCard>
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<Download className="w-6 h-6" />}
        onClick={() => {
          HapticService.trigger('medium');
          exportarRelatorio();
        }}
        tooltip="Exportar Relatório"
        color="bg-blue-500 hover:bg-blue-600"
        disabled={!resumo}
      />
    </div>
  );
};

// Desktop Reports Component
const DesktopRelatorios: React.FC<{
  loading: boolean
  resumo: RelatorioResumo | null
  filtroInicio: string
  filtroFim: string
  setFiltroInicio: (value: string) => void
  setFiltroFim: (value: string) => void
  definirPeriodoAtual: () => void
  limparFiltros: () => void
  exportarRelatorio: () => void
  handleRefresh: () => void
  refreshing: boolean
}> = ({
  loading,
  resumo,
  filtroInicio,
  filtroFim,
  setFiltroInicio,
  setFiltroFim,
  definirPeriodoAtual,
  limparFiltros,
  exportarRelatorio,
  handleRefresh,
  refreshing
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-600 dark:text-gray-400">Análise financeira do seu negócio</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            onClick={exportarRelatorio}
            disabled={!resumo}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Início
              </label>
              <Input
                type="date"
                value={filtroInicio}
                onChange={(e) => setFiltroInicio(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Fim
              </label>
              <Input
                type="date"
                value={filtroFim}
                onChange={(e) => setFiltroFim(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={definirPeriodoAtual}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Este Mês
              </Button>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={limparFiltros}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {resumo ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.totalServicos}</div>
              <p className="text-xs text-muted-foreground">
                {resumo.servicosEsteMes} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {resumo.receitaTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket médio: R$ {resumo.ticketMedio.toFixed(2)}
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
                R$ {resumo.lucroTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margem: {resumo.margemLucro.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peças Cadastradas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.totalPecas}</div>
              <p className="text-xs text-muted-foreground">
                Peças ativas no sistema
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum dado encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Não há serviços no período selecionado
            </p>
          </CardContent>
        </Card>
      )}

      {/* Performance Analysis */}
      {resumo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Análise de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-medium">Receita Média Mensal</span>
                <span className="font-bold text-blue-600">
                  R$ {(resumo.receitaTotal / Math.max(1, new Date().getMonth() + 1)).toFixed(0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium">Lucro por Serviço</span>
                <span className="font-bold text-green-600">
                  R$ {resumo.totalServicos > 0 ? (resumo.lucroTotal / resumo.totalServicos).toFixed(2) : '0,00'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm font-medium">Eficiência Operacional</span>
                <span className="font-bold text-purple-600">
                  {resumo.margemLucro > 50 ? 'Excelente' : resumo.margemLucro > 30 ? 'Boa' : 'Regular'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <span className="text-sm font-medium">Serviços por Status</span>
                <div className="text-right">
                  <div className="text-sm text-green-600">✓ {resumo.servicosPorStatus.concluido} Concluídos</div>
                  <div className="text-sm text-yellow-600">⏳ {resumo.servicosPorStatus.pendente} Pendentes</div>
                  <div className="text-sm text-red-600">✗ {resumo.servicosPorStatus.cancelado} Cancelados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resumo.margemLucro < 30 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Margem de lucro baixa:</strong> Considere revisar os preços ou reduzir custos das peças.
                  </p>
                </div>
              )}
              
              {resumo.ticketMedio < 100 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Ticket médio baixo:</strong> Explore oportunidades de serviços adicionais ou premium.
                  </p>
                </div>
              )}

              {resumo.totalServicos < 10 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    <strong>Volume baixo:</strong> Considere estratégias de marketing para aumentar a demanda.
                  </p>
                </div>
              )}

              {resumo.margemLucro > 50 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Excelente performance!</strong> Continue mantendo a qualidade e considere expandir os serviços.
                  </p>
                </div>
              )}

              {resumo.totalServicos === 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Comece agora:</strong> Cadastre seus primeiros serviços para começar a acompanhar o desempenho.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
};

export function Relatorios() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')
  const [resumo, setResumo] = useState<RelatorioResumo | null>(null)
  const { user } = useAuth()
  const { isMobile } = useMobile()

  useEffect(() => {
    loadServicos()
  }, [user])

  useEffect(() => {
    if (servicos.length >= 0) {
      calcularResumo()
    }
  }, [servicos, filtroInicio, filtroFim])

  const loadServicos = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Buscar serviços (detalhamento)
      let query = supabase
        .from('servicos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })

      if (filtroInicio && filtroFim) {
        const inicioIso = new Date(filtroInicio + 'T00:00:00Z').toISOString()
        const fimIso = new Date(filtroFim + 'T23:59:59Z').toISOString()
        query = query.gte('created_at', inicioIso).lte('created_at', fimIso)
      }

      const { data: servicosData, error: servicosError } = await query

      if (servicosError) throw servicosError

      setServicos(servicosData || [])
      await calcularResumo()
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadServicos()
    setRefreshing(false)
    toast.success('Dados atualizados!')
  }

  const calcularResumo = async () => {
    if (!user) return

    try {
      const params: { p_uid: string, p_inicio: string | null, p_fim: string | null } = {
        p_uid: user.id,
        p_inicio: filtroInicio ? new Date(filtroInicio + 'T00:00:00Z').toISOString() : null,
        p_fim: filtroFim ? new Date(filtroFim + 'T23:59:59Z').toISOString() : null
      }

      const { data, error } = await supabase.rpc('relatorio_resumo', params)
      if (error) throw error

      const r = (Array.isArray(data) ? data[0] : data) as any
      if (r) {
        setResumo({
          totalServicos: Number(r.total_servicos || 0),
          receitaTotal: Number(r.receita_total || 0),
          lucroTotal: Number(r.lucro_total || 0),
          ticketMedio: Number(r.ticket_medio || 0),
          margemLucro: Number(r.margem_lucro || 0),
          totalPecas: Number(r.total_pecas || 0),
          servicosEsteMes: Number(r.servicos_este_mes || 0),
          servicosPorStatus: {
            concluido: Number(r.concluidos || 0),
            pendente: Number(r.pendentes || 0),
            cancelado: Number(r.cancelados || 0)
          }
        })
      }
    } catch (error) {
      console.error('Erro ao calcular resumo (RPC):', error)
      // Fallback: cálculo client-side
      try {
        let servicosFiltrados = servicos
        if (filtroInicio && filtroFim) {
          const inicio = new Date(filtroInicio + 'T00:00:00Z')
          const fim = new Date(filtroFim + 'T23:59:59Z')
          servicosFiltrados = servicos.filter(s => {
            const d = new Date(s.created_at)
            return d >= inicio && d <= fim
          })
        }

        const totalServicos = servicosFiltrados.length
        const receitaTotal = servicosFiltrados.reduce((sum, s) => sum + (s.valor_total || 0), 0)
        const lucroTotal = servicosFiltrados.reduce((sum, s) => sum + (s.lucro || 0), 0)
        const ticketMedio = totalServicos > 0 ? receitaTotal / totalServicos : 0
        const margemLucro = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0
        const inicioMes = startOfMonth(new Date())
        const fimMes = endOfMonth(new Date())
        const servicosEsteMes = servicos.filter(s => {
          const d = new Date(s.created_at)
          return d >= inicioMes && d <= fimMes
        }).length
        const servicosPorStatus = {
          concluido: servicosFiltrados.filter(s => s.status === 'concluido').length,
          pendente: servicosFiltrados.filter(s => s.status === 'pendente').length,
          cancelado: servicosFiltrados.filter(s => s.status === 'cancelado').length
        }
        // Buscar total de peças ativas
        const { data: pecasData } = await supabase
          .from('pecas')
          .select('id')
          .eq('user_id', user.id)
          .eq('ativo', true)

        setResumo({
          totalServicos,
          receitaTotal,
          lucroTotal,
          ticketMedio,
          margemLucro,
          totalPecas: pecasData?.length || 0,
          servicosEsteMes,
          servicosPorStatus
        })
      } catch (fallbackError) {
        console.error('Erro no fallback de resumo:', fallbackError)
        toast.error('Erro ao obter resumo dos relatórios')
      }
    }
  }

  const definirPeriodoAtual = () => {
    const hoje = new Date()
    const inicioMes = startOfMonth(hoje)
    const fimMes = endOfMonth(hoje)
    
    setFiltroInicio(format(inicioMes, 'yyyy-MM-dd'))
    setFiltroFim(format(fimMes, 'yyyy-MM-dd'))
  }

  const limparFiltros = () => {
    setFiltroInicio('')
    setFiltroFim('')
  }

  const exportarRelatorio = () => {
    if (!resumo) return

    const periodo = filtroInicio && filtroFim 
      ? `${format(parseISO(filtroInicio), 'dd/MM/yyyy')} - ${format(parseISO(filtroFim), 'dd/MM/yyyy')}`
      : 'Todos os períodos'

    const conteudo = `
RELATÓRIO FINANCEIRO - ASSISTÊNCIA TÉCNICA
Período: ${periodo}
Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}

RESUMO GERAL:
- Total de Serviços: ${resumo.totalServicos}
- Receita Total: R$ ${resumo.receitaTotal.toFixed(2)}
- Lucro Total: R$ ${resumo.lucroTotal.toFixed(2)}
- Ticket Médio: R$ ${resumo.ticketMedio.toFixed(2)}
- Margem de Lucro: ${resumo.margemLucro.toFixed(1)}%
- Total de Peças: ${resumo.totalPecas}
- Serviços Este Mês: ${resumo.servicosEsteMes}

SERVIÇOS POR STATUS:
- Concluídos: ${resumo.servicosPorStatus.concluido}
- Pendentes: ${resumo.servicosPorStatus.pendente}
- Cancelados: ${resumo.servicosPorStatus.cancelado}

DETALHAMENTO DOS SERVIÇOS:
${servicos.map(servico => `
- ${servico.nome_aparelho || 'Aparelho não informado'}
  Data: ${format(parseISO(servico.created_at), 'dd/MM/yyyy')}
  Valor: R$ ${(servico.valor_total || 0).toFixed(2)}
  Custo: R$ ${(servico.custo_peca || 0).toFixed(2)}
  Lucro: R$ ${(servico.lucro || 0).toFixed(2)}
  Status: ${servico.status || 'Não informado'}
  ${servico.observacoes ? `Obs: ${servico.observacoes}` : ''}
`).join('')}
    `

    const blob = new Blob([conteudo], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Relatório exportado com sucesso!')
  }

  // Create common props object
  const commonProps = {
    loading,
    resumo,
    filtroInicio,
    filtroFim,
    setFiltroInicio,
    setFiltroFim,
    definirPeriodoAtual,
    limparFiltros,
    exportarRelatorio,
    handleRefresh,
    refreshing
  }

  // Render mobile or desktop version based on screen size
  if (isMobile) {
    return <MobileRelatorios {...commonProps} />
  }

  return <DesktopRelatorios {...commonProps} />
}
