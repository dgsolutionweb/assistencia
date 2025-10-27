import { useEffect, useState } from 'react'
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
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RelatorioResumo {
  totalServicos: number
  receitaTotal: number
  lucroTotal: number
  ticketMedio: number
  margemLucro: number
}

export function Relatorios() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')
  const [resumo, setResumo] = useState<RelatorioResumo | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    loadServicos()
  }, [user])

  useEffect(() => {
    if (servicos.length > 0) {
      calcularResumo()
    }
  }, [servicos, filtroInicio, filtroFim])

  const loadServicos = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setServicos(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const calcularResumo = () => {
    let servicosFiltrados = servicos

    // Aplicar filtro de data se especificado
    if (filtroInicio && filtroFim) {
      const inicio = parseISO(filtroInicio)
      const fim = parseISO(filtroFim)
      
      servicosFiltrados = servicos.filter(servico => {
        const dataServico = parseISO(servico.created_at)
        return isWithinInterval(dataServico, { start: inicio, end: fim })
      })
    }

    const totalServicos = servicosFiltrados.length
    const receitaTotal = servicosFiltrados.reduce((sum, servico) => sum + servico.valor_total, 0)
    const lucroTotal = servicosFiltrados.reduce((sum, servico) => sum + servico.lucro, 0)
    const ticketMedio = totalServicos > 0 ? receitaTotal / totalServicos : 0
    const margemLucro = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0

    setResumo({
      totalServicos,
      receitaTotal,
      lucroTotal,
      ticketMedio,
      margemLucro
    })
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

DETALHAMENTO DOS SERVIÇOS:
${servicos.map(servico => `
- ${servico.nome_aparelho}
  Data: ${format(parseISO(servico.created_at), 'dd/MM/yyyy')}
  Valor: R$ ${servico.valor_total.toFixed(2)}
  Custo: R$ ${servico.custo_peca.toFixed(2)}
  Lucro: R$ ${servico.lucro.toFixed(2)}
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
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise financeira do seu negócio</p>
        </div>
        <Button onClick={exportarRelatorio} disabled={!resumo}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros de Período
          </CardTitle>
          <CardDescription>
            Selecione um período para análise específica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-48">
              <Input
                label="Data Início"
                type="date"
                value={filtroInicio}
                onChange={(e) => setFiltroInicio(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-48">
              <Input
                label="Data Fim"
                type="date"
                value={filtroFim}
                onChange={(e) => setFiltroFim(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={definirPeriodoAtual}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Este Mês
              </Button>
              <Button
                variant="ghost"
                onClick={limparFiltros}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.totalServicos}</div>
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
                R$ {resumo.receitaTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor total faturado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {resumo.lucroTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Lucro líquido obtido
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {resumo.ticketMedio.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor médio por serviço
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {resumo.margemLucro.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Percentual de lucro
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Análise Detalhada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Análise de Performance</CardTitle>
            <CardDescription>
              Indicadores de desempenho do negócio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumo && (
              <>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-800">
                    Receita Média Mensal
                  </span>
                  <span className="font-bold text-red-600">
                    R$ {(resumo.receitaTotal / Math.max(1, new Date().getMonth() + 1)).toFixed(2)}
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
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendações</CardTitle>
            <CardDescription>
              Sugestões para melhorar o desempenho
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumo && (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}