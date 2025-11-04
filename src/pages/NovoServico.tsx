import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/Loading'
import { supabase, type Peca } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { ArrowLeft, Package, Plus, X } from 'lucide-react'

const servicoSchema = z.object({
  nome_aparelho: z.string().min(1, 'Nome do aparelho é obrigatório'),
  valor_total: z.number().min(0.01, 'Valor total deve ser maior que zero'),
  custo_peca: z.number().min(0, 'Custo da peça deve ser maior ou igual a zero'),
  pecas_ids: z.array(z.string()).optional(),
  observacoes: z.string().optional(),
})

type ServicoForm = z.infer<typeof servicoSchema>

interface PecaSelecionada {
  id: string
  nome: string
  custo: number
}

export function NovoServico() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [usarPecaCadastrada, setUsarPecaCadastrada] = useState(false)
  const [pecas, setPecas] = useState<Peca[]>([])
  const [loadingPecas, setLoadingPecas] = useState(false)
  const [pecasSelecionadas, setPecasSelecionadas] = useState<PecaSelecionada[]>([])
  const [pecaParaAdicionar, setPecaParaAdicionar] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<ServicoForm>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nome_aparelho: '',
      valor_total: 0,
      custo_peca: 0,
      pecas_ids: [],
      observacoes: ''
    }
  })

  const valorTotal = watch('valor_total')
  const custoPeca = watch('custo_peca')

  // Calcular custo total das peças selecionadas
  const custoTotalPecas = usarPecaCadastrada 
    ? pecasSelecionadas.reduce((total, peca) => total + peca.custo, 0)
    : custoPeca

  const lucro = valorTotal - custoTotalPecas

  useEffect(() => {
    if (user) {
      carregarPecas()
    }
  }, [user])

  useEffect(() => {
    if (usarPecaCadastrada) {
      carregarPecas()
    }
  }, [usarPecaCadastrada])

  const carregarPecas = async () => {
    setLoadingPecas(true)
    try {
      const { data, error } = await supabase
        .from('pecas')
        .select('*')
        .eq('user_id', user?.id)
        .order('nome')

      if (error) throw error
      setPecas(data || [])
    } catch (error) {
      console.error('Erro ao carregar peças:', error)
      toast.error('Erro ao carregar peças')
    } finally {
      setLoadingPecas(false)
    }
  }

  const handlePecaChange = (pecaId: string) => {
    if (pecaId) {
      const peca = pecas.find(p => p.id === pecaId)
      if (peca) {
        setValue('custo_peca', peca.preco_custo + peca.frete)
      }
    } else {
      setValue('custo_peca', 0)
    }
  }

  const adicionarPeca = (pecaId: string) => {
    const peca = pecas.find(p => p.id === pecaId)
    if (!peca) return

    // Verificar se a peça já foi selecionada
    if (pecasSelecionadas.some(p => p.id === pecaId)) {
      toast.error('Esta peça já foi selecionada')
      return
    }

    const novaPeca: PecaSelecionada = {
      id: peca.id,
      nome: peca.nome,
      custo: peca.preco_custo + peca.frete
    }

    setPecasSelecionadas(prev => [...prev, novaPeca])
    setPecaParaAdicionar('')
    
    // Atualizar o array de IDs no formulário
    const novosIds = [...pecasSelecionadas.map(p => p.id), pecaId]
    setValue('pecas_ids', novosIds)
  }

  const removerPeca = (pecaId: string) => {
    setPecasSelecionadas(prev => prev.filter(p => p.id !== pecaId))
    
    // Atualizar o array de IDs no formulário
    const novosIds = pecasSelecionadas.filter(p => p.id !== pecaId).map(p => p.id)
    setValue('pecas_ids', novosIds)
  }

  const onSubmit = async (data: ServicoForm) => {
    if (!user) return

    setIsLoading(true)
    try {
      // Preparar dados do serviço
      const servicoData = {
        nome_aparelho: data.nome_aparelho,
        valor_total: data.valor_total,
        custo_peca: usarPecaCadastrada ? custoTotalPecas : data.custo_peca,
        observacoes: data.observacoes || null,
        usuario_id: user.id,
        // Salvar IDs das peças como JSON se houver peças selecionadas
        pecas_ids: usarPecaCadastrada && pecasSelecionadas.length > 0 
          ? JSON.stringify(pecasSelecionadas.map(p => ({ id: p.id, nome: p.nome, custo: p.custo })))
          : null
      }

      const { error } = await supabase
        .from('servicos')
        .insert([servicoData])

      if (error) throw error

      toast.success('Serviço cadastrado com sucesso!')
      navigate('/servicos')
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
      toast.error('Erro ao salvar serviço')
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Novo Serviço</h1>
          <p className="text-gray-600">Cadastre um novo serviço realizado</p>
        </div>
      </div>

      <div className="max-w-2xl">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custo da Peça
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!usarPecaCadastrada}
                          onChange={() => {
                            setUsarPecaCadastrada(false)
                            setPecasSelecionadas([])
                            setValue('pecas_ids', [])
                            setValue('custo_peca', 0)
                          }}
                          className="mr-2"
                        />
                        Manual
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={usarPecaCadastrada}
                          onChange={() => setUsarPecaCadastrada(true)}
                          className="mr-2"
                        />
                        Peça Cadastrada
                      </label>
                    </div>

                    {!usarPecaCadastrada ? (
                      <Input
                        type="number"
                        step="0.01"
                        {...register('custo_peca', { valueAsNumber: true })}
                        error={errors.custo_peca?.message}
                        disabled={isLoading}
                        placeholder="0,00"
                      />
                    ) : (
                      <div className="space-y-4">
                        {loadingPecas ? (
                          <div className="flex items-center space-x-2 p-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-sm text-gray-500">Carregando peças...</span>
                          </div>
                        ) : (
                          <>
                            {/* Seletor para adicionar peças */}
                            <div className="flex space-x-2">
                              <select
                                value={pecaParaAdicionar}
                                onChange={(e) => setPecaParaAdicionar(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                disabled={isLoading}
                              >
                                <option value="">Selecione uma peça para adicionar</option>
                                {pecas
                                  .filter(peca => !pecasSelecionadas.some(p => p.id === peca.id))
                                  .map((peca) => (
                                    <option key={peca.id} value={peca.id}>
                                      {peca.nome} - R$ {(peca.preco_custo + peca.frete).toFixed(2)}
                                    </option>
                                  ))}
                              </select>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => pecaParaAdicionar && adicionarPeca(pecaParaAdicionar)}
                                disabled={!pecaParaAdicionar || isLoading}
                                className="flex items-center space-x-1"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Adicionar</span>
                              </Button>
                            </div>

                            {/* Lista de peças selecionadas */}
                            {pecasSelecionadas.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">
                                  Peças Selecionadas ({pecasSelecionadas.length})
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {pecasSelecionadas.map((peca) => (
                                    <div
                                      key={peca.id}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                    >
                                      <div className="flex-1">
                                        <span className="font-medium text-gray-900">
                                          {peca.nome}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-600">
                                          R$ {peca.custo.toFixed(2)}
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => removerPeca(peca.id)}
                                        disabled={isLoading}
                                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Total das peças selecionadas */}
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-800">
                                      Custo Total das Peças:
                                    </span>
                                    <span className="text-lg font-bold text-blue-600">
                                      R$ {custoTotalPecas.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate('/pecas/nova')}
                                className="flex items-center space-x-1"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Nova Peça</span>
                              </Button>
                              {pecas.length === 0 && (
                                <span className="text-sm text-gray-500">
                                  Nenhuma peça cadastrada
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                  {usarPecaCadastrada && pecasSelecionadas.length > 0
                    ? `Valor Total (R$ ${valorTotal.toFixed(2)}) - Custo das Peças (R$ ${custoTotalPecas.toFixed(2)}) = Lucro`
                    : 'Valor Total - Custo da Peça = Lucro'
                  }
                </p>
                
                {/* Breakdown detalhado quando há múltiplas peças */}
                {usarPecaCadastrada && pecasSelecionadas.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs font-medium text-green-700 mb-2">Breakdown dos custos:</p>
                    <div className="space-y-1">
                      {pecasSelecionadas.map((peca) => (
                        <div key={peca.id} className="flex justify-between text-xs text-green-600">
                          <span>{peca.nome}</span>
                          <span>R$ {peca.custo.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-medium text-green-700 pt-1 border-t border-green-300">
                        <span>Total das Peças</span>
                        <span>R$ {custoTotalPecas.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
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
                    'Salvar Serviço'
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