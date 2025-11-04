import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/Loading'
import { supabase, Servico } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    loadServicos()
  }, [user])

  async function loadServicos() {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setServicos(data || [])
    } catch (err) {
      console.error('Erro ao carregar serviços:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return
    try {
      setDeletingId(id)
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id)
      if (error) throw error
      setServicos((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      console.error('Erro ao excluir serviço:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = servicos.filter((s) =>
    s.nome_aparelho.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
            <Link to="/servicos/novo">
              <Button>
                Novo
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-48">
              <LoadingSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500">Nenhum serviço encontrado.</div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((s) => (
                <li key={s.id} className="border rounded p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.nome_aparelho}</div>
                    <div className="text-sm text-gray-500">R$ {s.valor_total.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/servicos/editar/${s.id}`}>
                      <Button variant="secondary">Editar</Button>
                    </Link>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(s.id)}
                      loading={deletingId === s.id}
                    >
                      Excluir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}