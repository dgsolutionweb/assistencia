import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/Loading'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Servico } from '@/lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    loadServicos()
  }, [user])

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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      setDeletingId(id)
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setServicos(servicos.filter(servico => servico.id !== id))
      toast.success('Serviço excluído com sucesso!')
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Erro ao excluir serviço')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredServicos = servicos.filter(servico =>
    servico.nome_aparelho.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalReceita = servicos.reduce((sum, servico) => sum + servico.valor_total, 0)
  const totalLucro = servicos.reduce((sum, servico) => sum + servico.lucro, 0)

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
          <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-600">Gerencie todos os seus serviços</p>
        </div>
        <Link to="/servicos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalReceita.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalLucro.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nome do aparelho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      {filteredServicos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
              </div>
              {!searchTerm && (
                <Link to="/servicos/novo">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Serviço
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServicos.map((servico) => (
            <Card key={servico.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{servico.nome_aparelho}</CardTitle>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(servico.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor Total:</span>
                    <span className="font-medium">R$ {servico.valor_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Custo Peça:</span>
                    <span className="font-medium">R$ {servico.custo_peca.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-green-600">Lucro:</span>
                    <span className="font-bold text-green-600">
                      R$ {servico.lucro.toFixed(2)}
                    </span>
                  </div>
                  
                  {servico.observacoes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <strong>Observações:</strong> {servico.observacoes}
                    </div>
                  )}

                  <div className="flex space-x-2 mt-4">
                    <Link to={`/servicos/editar/${servico.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(servico.id)}
                      disabled={deletingId === servico.id}
                      className="flex-1"
                    >
                      {deletingId === servico.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}