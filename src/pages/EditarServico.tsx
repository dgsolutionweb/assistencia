import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/Loading'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

const servicoSchema = z.object({
  nome_aparelho: z.string().min(1, 'Nome do aparelho é obrigatório'),
  valor_total: z.number().min(0.01, 'Valor total deve ser maior que zero'),
  custo_peca: z.number().min(0, 'Custo da peça deve ser maior ou igual a zero'),
  observacoes: z.string().optional(),
})

type ServicoForm = z.infer<typeof servicoSchema>

export function EditarServico() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ServicoForm>({
    resolver: zodResolver(servicoSchema),
  })

  const valorTotal = watch('valor_total') || 0
  const custoPeca = watch('custo_peca') || 0
  const lucro = valorTotal - custoPeca

  useEffect(() => {
    if (id && user) {
      loadServico()
    }
  }, [id, user])

  const loadServico = async () => {
    if (!id || !user) return

    try {
      setLoadingData(true)
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('id', id)
        .eq('usuario_id', user.id)
        .single()

      if (error) throw error

      if (!data) {
        toast.error('Serviço não encontrado')
        navigate('/servicos')
        return
      }

      // Populate form with existing data
      setValue('nome_aparelho', data.nome_aparelho)
      setValue('valor_total', data.valor_total)
      setValue('custo_peca', data.custo_peca)
      setValue('observacoes', data.observacoes || '')
    } catch (error) {
      console.error('Error loading service:', error)
      toast.error('Erro ao carregar serviço')
      navigate('/servicos')
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: ServicoForm) => {
    if (!user || !id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('servicos')
        .update({
          nome_aparelho: data.nome_aparelho,
          valor_total: data.valor_total,
          custo_peca: data.custo_peca,
          observacoes: data.observacoes || null,
        })
        .eq('id', id!)
        .eq('usuario_id', user.id)

      if (error) throw error

      toast.success('Serviço atualizado com sucesso!')
      navigate('/servicos')
    } catch (error) {
      console.error('Error updating service:', error)
      toast.error('Erro ao atualizar serviço')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Serviço</h1>
          <p className="text-gray-600">Atualize as informações do serviço</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nome do Aparelho"
                {...register('nome_aparelho')}
                error={errors.nome_aparelho?.message}
                disabled={isLoading}
                placeholder="Ex: iPhone 12, Samsung Galaxy S21"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Valor Total (R$)"
                  type="number"
                  step="0.01"
                  {...register('valor_total', { valueAsNumber: true })}
                  error={errors.valor_total?.message}
                  disabled={isLoading}
                  placeholder="0,00"
                />

                <Input
                  label="Custo da Peça (R$)"
                  type="number"
                  step="0.01"
                  {...register('custo_peca', { valueAsNumber: true })}
                  error={errors.custo_peca?.message}
                  disabled={isLoading}
                  placeholder="0,00"
                />
              </div>

              {/* Lucro calculado */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">
                    Lucro Calculado:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    R$ {lucro.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Valor Total - Custo da Peça = Lucro
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  {...register('observacoes')}
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Observações sobre o serviço (opcional)"
                />
                {errors.observacoes && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.observacoes.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/servicos')}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}