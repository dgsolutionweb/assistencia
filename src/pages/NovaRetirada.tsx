import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Wallet, ArrowLeft, Calendar, User, FileText } from 'lucide-react'
import { toast } from 'sonner'

export function NovaRetirada() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    tipo: 'salario' as 'salario' | 'despesa' | 'fornecedor' | 'outros',
    valor: '',
    descricao: '',
    beneficiario: '',
    observacoes: '',
    data_retirada: new Date().toISOString().slice(0, 16)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast.error('Por favor, informe um valor válido')
      return
    }

    if (!formData.descricao.trim()) {
      toast.error('Por favor, informe uma descrição')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.from('retiradas').insert({
        usuario_id: user.id,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        descricao: formData.descricao.trim(),
        beneficiario: formData.beneficiario.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        data_retirada: formData.data_retirada
      })

      if (error) throw error

      toast.success('Retirada registrada com sucesso!')
      navigate('/retiradas')
    } catch (error) {
      console.error('Error creating retirada:', error)
      toast.error('Erro ao registrar retirada')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/retiradas')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Retirada</h1>
          <p className="text-gray-600">Registre salários, despesas e outras retiradas</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Informações da Retirada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Retirada *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="salario">Salário</option>
                  <option value="despesa">Despesa</option>
                  <option value="fornecedor">Pagamento a Fornecedor</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                  required
                  className="text-lg font-semibold"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Descrição *
                </label>
                <Input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Pagamento salário funcionário João"
                  required
                  maxLength={255}
                />
              </div>

              {/* Beneficiário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Beneficiário (opcional)
                </label>
                <Input
                  type="text"
                  value={formData.beneficiario}
                  onChange={(e) => setFormData({ ...formData, beneficiario: e.target.value })}
                  placeholder="Nome de quem recebeu o dinheiro"
                  maxLength={255}
                />
              </div>

              {/* Data da Retirada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data e Hora da Retirada *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.data_retirada}
                  onChange={(e) => setFormData({ ...formData, data_retirada: e.target.value })}
                  required
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre esta retirada..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                  maxLength={1000}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/retiradas')}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Salvando...' : 'Registrar Retirada'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Card informativo */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Wallet className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">💡 Dica</p>
              <p>
                Registre todas as retiradas do caixa para manter um controle preciso das suas finanças.
                Isso inclui salários, pagamentos a fornecedores, despesas operacionais e outras saídas de dinheiro.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
