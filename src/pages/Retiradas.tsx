import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, type Retirada } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/Loading'
import { Wallet, Plus, Trash2, Calendar, User, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const tipoLabels = {
  salario: 'Salário',
  despesa: 'Despesa',
  fornecedor: 'Fornecedor',
  outros: 'Outros'
}

const tipoColors = {
  salario: 'bg-blue-100 text-blue-800',
  despesa: 'bg-red-100 text-red-800',
  fornecedor: 'bg-yellow-100 text-yellow-800',
  outros: 'bg-gray-100 text-gray-800'
}

export function Retiradas() {
  const [retiradas, setRetiradas] = useState<Retirada[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const { user } = useAuth()

  useEffect(() => {
    loadRetiradas()
  }, [user, filtroTipo])

  const loadRetiradas = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('retiradas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_retirada', { ascending: false })

      if (filtroTipo !== 'todos') {
        query = query.eq('tipo', filtroTipo)
      }

      const { data, error } = await query

      if (error) throw error
      setRetiradas(data || [])
    } catch (error) {
      console.error('Error loading retiradas:', error)
      toast.error('Erro ao carregar retiradas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta retirada?')) return

    try {
      const { error } = await supabase
        .from('retiradas')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Retirada excluída com sucesso!')
      loadRetiradas()
    } catch (error) {
      console.error('Error deleting retirada:', error)
      toast.error('Erro ao excluir retirada')
    }
  }

  const totalRetiradas = retiradas.reduce((sum, r) => sum + r.valor, 0)

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
          <h1 className="text-3xl font-bold text-gray-900">Retiradas</h1>
          <p className="text-gray-600">Gerencie salários, despesas e outras retiradas</p>
        </div>
        <Link to="/retiradas/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Retirada
          </Button>
        </Link>
      </div>

      {/* Card de resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Total de Retiradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            R$ {totalRetiradas.toFixed(2)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {retiradas.length} {retiradas.length === 1 ? 'retirada' : 'retiradas'} registrada(s)
          </p>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Filtrar por tipo:</label>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="todos">Todos</option>
          <option value="salario">Salário</option>
          <option value="despesa">Despesa</option>
          <option value="fornecedor">Fornecedor</option>
          <option value="outros">Outros</option>
        </select>
      </div>

      {/* Lista de retiradas */}
      {retiradas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma retirada registrada</p>
            <Link to="/retiradas/nova">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Registrar primeira retirada
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {retiradas.map((retirada, index) => (
            <motion.div
              key={retirada.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tipoColors[retirada.tipo]}`}>
                          {tipoLabels[retirada.tipo]}
                        </span>
                        <span className="text-2xl font-bold text-red-600">
                          - R$ {retirada.valor.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{retirada.descricao}</span>
                      </div>

                      {retirada.beneficiario && (
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">Beneficiário: {retirada.beneficiario}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(retirada.data_retirada), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      {retirada.observacoes && (
                        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          <p className="font-medium mb-1">Observações:</p>
                          <p>{retirada.observacoes}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(retirada.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
