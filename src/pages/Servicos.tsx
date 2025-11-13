import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/Loading'
import { supabase, Servico } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Calendar, Filter, Pencil, Trash2, CheckCircle, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { useMobile } from '@/hooks/useMobile'

export function Servicos() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Servico['status'] | 'todos'>('todos')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { user } = useAuth()
  const { isMobile } = useMobile()
  const { data: servicos = [], isLoading: loading } = useQuery<Servico[]>({
    queryKey: ['servicos', user?.id, searchTerm, statusFilter, dateStart, dateEnd],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('servicos')
        .select('*')
        .eq('usuario_id', user!.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'todos') query = query.eq('status', statusFilter)
      if (searchTerm) {
        const term = `%${searchTerm}%`
        query = query.ilike('nome_aparelho', term)
      }
      if (dateStart && dateEnd) {
        const startIso = new Date(dateStart + 'T00:00:00Z').toISOString()
        const endIso = new Date(dateEnd + 'T23:59:59Z').toISOString()
        query = query.gte('created_at', startIso).lte('created_at', endIso)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('servicos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'servicos' })
    }
  })

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return
    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    } catch (err) {
      console.error('Erro ao excluir serviço:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: Servico['status'] }) => {
      const { error } = await supabase.from('servicos').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'servicos' })
    }
  })

  const handleStatusChange = async (id: string, status: Servico['status']) => {
    try {
      setUpdatingId(id)
      await updateStatusMutation.mutateAsync({ id, status })
      toast.success(`Status atualizado para ${status}`)
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      const msg = (err as any)?.message || 'Falha ao atualizar status'
      toast.error(msg)
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(servicos.map(s => s.id))
  }, [servicos])

  const clearSelection = useCallback(() => setSelectedIds([]), [])

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Excluir ${selectedIds.length} serviço(s)?`)) return
    try {
      const { error } = await supabase.from('servicos').delete().in('id', selectedIds)
      if (error) throw error
      clearSelection()
      queryClient.invalidateQueries({ queryKey: ['servicos', user?.id] })
    } catch (err) {
      console.error('Erro ao excluir em lote:', err)
    }
  }

  const resumo = useMemo(() => {
    const totalServicos = servicos.length
    const receitaTotal = servicos.reduce((sum, s) => sum + (s.valor_total || 0), 0)
    const lucroTotal = servicos.reduce((sum, s) => sum + ((s.valor_total || 0) - (s.custo_peca || 0)), 0)
    return { totalServicos, receitaTotal, lucroTotal }
  }, [servicos])

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const filtered = servicos

  const listContent = (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Serviços
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <>
                  <Button variant="secondary" size="sm" onClick={clearSelection}>Limpar seleção</Button>
                  <Button variant="danger" size="sm" onClick={bulkDelete}>Excluir selecionados</Button>
                </>
              )}
              <Link to="/servicos/novo">
                <Button className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Serviço
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2 text-gray-600"><Search className="h-4 w-4" />Buscar</div>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nome do aparelho" className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2 text-gray-600"><Filter className="h-4 w-4" />Status</div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full px-3 py-2 border rounded-md">
                <option value="todos">Todos</option>
                <option value="concluido">Concluído</option>
                <option value="pendente">Pendente</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2 text-gray-600"><Calendar className="h-4 w-4" />Início</div>
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2 text-gray-600"><Calendar className="h-4 w-4" />Fim</div>
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border p-4 bg-white"><div className="text-sm text-gray-500">Total de Serviços</div><div className="text-2xl font-bold">{resumo.totalServicos}</div></div>
            <div className="rounded-lg border p-4 bg-white"><div className="text-sm text-gray-500">Receita Total</div><div className="text-2xl font-bold text-green-600">{formatBRL(resumo.receitaTotal)}</div></div>
            <div className="rounded-lg border p-4 bg-white"><div className="text-sm text-gray-500">Lucro Total</div><div className="text-2xl font-bold text-green-600">{formatBRL(resumo.lucroTotal)}</div></div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-48">
              <LoadingSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500">Nenhum serviço encontrado.</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3"><input type="checkbox" onChange={(e) => e.target.checked ? selectAll() : clearSelection()} /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aparelho</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{s.nome_aparelho}</div>
                        {s.observacoes && <div className="text-xs text-gray-500 truncate max-w-xs">{s.observacoes}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{formatBRL(s.valor_total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${s.status === 'concluido' ? 'bg-green-100 text-green-800' : s.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {s.status === 'concluido' ? <CheckCircle className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(s.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleStatusChange(s.id, 'concluido')} loading={updatingId === s.id}>
                            Concluir
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleStatusChange(s.id, 'pendente')} loading={updatingId === s.id}>
                            Pendente
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleStatusChange(s.id, 'cancelado')} loading={updatingId === s.id}>
                            Cancelar
                          </Button>
                          <Link to={`/servicos/editar/${s.id}`} className="inline-flex">
                            <Button variant="secondary" size="sm" className="inline-flex items-center gap-1">
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                          </Link>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)} loading={deletingId === s.id} className="inline-flex items-center gap-1">
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  if (isMobile) {
    return (
      <div className="p-4">
        <div className="px-4 py-6 bg-gradient-to-r from-red-600 to-pink-600 text-white -mx-4 -mt-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Serviços</h1>
            <Link to="/servicos/novo" className="inline-flex">
              <Button className="bg-white text-red-600 hover:bg-red-50 inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Novo
              </Button>
            </Link>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="bg-white rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-2 text-gray-600"><Search className="h-4 w-4" />Buscar</div>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nome do aparelho" className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2 text-gray-600"><Filter className="h-4 w-4" />Status</div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full px-3 py-2 border rounded-md">
                <option value="todos">Todos</option>
                <option value="concluido">Concluído</option>
                <option value="pendente">Pendente</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2 text-gray-600"><Calendar className="h-4 w-4" />Início</div>
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2 text-gray-600"><Calendar className="h-4 w-4" />Fim</div>
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 bg-white text-center">
              <div className="text-xs text-gray-500">Serviços</div>
              <div className="text-xl font-bold">{resumo.totalServicos}</div>
            </div>
            <div className="rounded-lg border p-3 bg-white text-center">
              <div className="text-xs text-gray-500">Receita</div>
              <div className="text-xl font-bold text-green-600">{formatBRL(resumo.receitaTotal)}</div>
            </div>
            <div className="rounded-lg border p-3 bg-white text-center">
              <div className="text-xs text-gray-500">Lucro</div>
              <div className="text-xl font-bold text-green-600">{formatBRL(resumo.lucroTotal)}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-32"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 px-2">Nenhum serviço encontrado.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white rounded-lg border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{s.nome_aparelho}</div>
                    <div className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString('pt-BR')}</div>
                    {s.observacoes && <div className="text-xs text-gray-500 mt-1">{s.observacoes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{formatBRL(s.valor_total)}</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${s.status === 'concluido' ? 'bg-green-100 text-green-800' : s.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {s.status === 'concluido' ? <CheckCircle className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                      {s.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="secondary" size="sm" onClick={() => handleStatusChange(s.id, 'concluido')} loading={updatingId === s.id}>Concluir</Button>
                  <Button variant="secondary" size="sm" onClick={() => handleStatusChange(s.id, 'pendente')} loading={updatingId === s.id}>Pendente</Button>
                  <Button variant="secondary" size="sm" onClick={() => handleStatusChange(s.id, 'cancelado')} loading={updatingId === s.id}>Cancelar</Button>
                  <Link to={`/servicos/editar/${s.id}`} className="ml-auto inline-flex"><Button variant="secondary" size="sm">Editar</Button></Link>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)} loading={deletingId === s.id}>Excluir</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return listContent
}
