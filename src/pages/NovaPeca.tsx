import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Upload, Loader2, CheckCircle, AlertCircle, Edit2, Trash2, Check, X } from 'lucide-react';
import { supabase, type Peca } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
type PecaExtraida = {
  nome: string;
  preco_custo: number;
  frete: number;
  fornecedor?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
};

type ResultadoAnalise = {
  pecas: PecaExtraida[];
  frete_total: number;
  fornecedor_geral?: string;
};

function validarImagemPeca(file: File): { valido: boolean; erro?: string } {
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!tiposPermitidos.includes(file.type)) {
    return { valido: false, erro: 'Tipo de arquivo não suportado. Use JPG, PNG ou WebP.' };
  }
  const tamanhoMaximo = 10 * 1024 * 1024;
  if (file.size > tamanhoMaximo) {
    return { valido: false, erro: 'Arquivo muito grande. Máximo 10MB.' };
  }
  return { valido: true };
}
 

const pecaSchema = z.object({
  nome: z.string().min(1, 'Nome da peça é obrigatório'),
  preco_custo: z.number().min(0, 'Preço deve ser maior que zero'),
  frete: z.number().min(0, 'Frete deve ser maior ou igual a zero'),
  fornecedor: z.string().optional(),
  observacoes: z.string().optional(),
});

type PecaForm = z.infer<typeof pecaSchema>;

interface PecaParaAprovacao extends PecaExtraida {
  id: string;
  aprovada: boolean;
  editando: boolean;
}

export default function NovaPeca() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modoMultiplo, setModoMultiplo] = useState(false);
  const [pecasEncontradas, setPecasEncontradas] = useState<PecaParaAprovacao[]>([]);
  const [resultadoAnalise, setResultadoAnalise] = useState<ResultadoAnalise | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PecaForm>({
    resolver: zodResolver(pecaSchema),
    defaultValues: {
      preco_custo: 0,
      frete: 0,
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar arquivo
    const validacao = validarImagemPeca(file);
    if (!validacao.valido) {
      toast.error(validacao.erro);
      return;
    }

    setImageFile(file);
    
    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const respCompleto = await fetch('/api/analyze-note', { method: 'POST', body: fd });
      if (!respCompleto.ok) throw new Error('Falha na análise completa');
      const resultadoCompleto: ResultadoAnalise = await respCompleto.json();
      
      if (resultadoCompleto.pecas.length > 1) {
        // Múltiplas peças encontradas
        setModoMultiplo(true);
        setResultadoAnalise(resultadoCompleto);
        
        const pecasComAprovacao: PecaParaAprovacao[] = resultadoCompleto.pecas.map((peca, index) => ({
          ...peca,
          id: `peca-${index}`,
          aprovada: true, // Por padrão, todas aprovadas
          editando: false,
        }));
        
        setPecasEncontradas(pecasComAprovacao);
        toast.success(`${resultadoCompleto.pecas.length} peças encontradas! Revise e aprove as que deseja cadastrar.`);
      } else if (resultadoCompleto.pecas.length === 1) {
        // Uma peça encontrada - modo tradicional
        setModoMultiplo(false);
        const peca = resultadoCompleto.pecas[0];
        setValue('nome', peca.nome);
        setValue('preco_custo', peca.preco_custo);
        setValue('frete', peca.frete);
        setValue('fornecedor', peca.fornecedor);
        toast.success('Dados extraídos com sucesso! Verifique e ajuste se necessário.');
      }
    } catch (error) {
      try {
        const fd2 = new FormData();
        fd2.append('image', file);
        const respPeca = await fetch('/api/analyze-piece', { method: 'POST', body: fd2 });
        if (!respPeca.ok) throw new Error('Falha na análise simples');
        const resultado: PecaExtraida = await respPeca.json();
        setModoMultiplo(false);
        setValue('nome', resultado.nome);
        setValue('preco_custo', resultado.preco_custo);
        setValue('frete', resultado.frete);
        setValue('fornecedor', resultado.fornecedor);
        toast.success('Dados extraídos com sucesso! Verifique e ajuste se necessário.');
      } catch (error2) {
        console.error('Erro na análise:', error2);
        toast.error('Erro ao analisar imagem. Preencha os dados manualmente.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleAprovacao = (id: string) => {
    setPecasEncontradas(prev => 
      prev.map(peca => 
        peca.id === id ? { ...peca, aprovada: !peca.aprovada } : peca
      )
    );
  };

  const toggleEdicao = (id: string) => {
    setPecasEncontradas(prev => 
      prev.map(peca => 
        peca.id === id ? { ...peca, editando: !peca.editando } : peca
      )
    );
  };

  const atualizarPeca = (id: string, campo: keyof PecaExtraida, valor: any) => {
    setPecasEncontradas(prev => 
      prev.map(peca => 
        peca.id === id ? { ...peca, [campo]: valor } : peca
      )
    );
  };

  const removerPeca = (id: string) => {
    setPecasEncontradas(prev => prev.filter(peca => peca.id !== id));
  };

  const aprovarTodas = () => {
    setPecasEncontradas(prev => prev.map(peca => ({ ...peca, aprovada: true })));
  };

  const reprovarTodas = () => {
    setPecasEncontradas(prev => prev.map(peca => ({ ...peca, aprovada: false })));
  };

  const onSubmit = async (data: PecaForm) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      let imageUrl = null;

      // Upload da imagem se houver
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pecas-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('pecas-images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      if (modoMultiplo) {
        // Cadastrar múltiplas peças aprovadas
        const pecasAprovadas = pecasEncontradas.filter(peca => peca.aprovada);
        
        if (pecasAprovadas.length === 0) {
          toast.error('Nenhuma peça foi aprovada para cadastro');
          return;
        }

        const pecasParaInserir = pecasAprovadas.map(peca => ({
          nome: peca.nome,
          preco_custo: peca.preco_custo,
          frete: peca.frete,
          fornecedor: peca.fornecedor,
          user_id: user.id,
          imagem_url: imageUrl,
          ativo: true,
        }));

        const { error } = await supabase
          .from('pecas')
          .insert(pecasParaInserir);

        if (error) throw error;

        toast.success(`${pecasAprovadas.length} peças cadastradas com sucesso!`);
      } else {
        // Cadastrar peça única
        const { error } = await supabase
          .from('pecas')
          .insert({
            ...data,
            user_id: user.id,
            imagem_url: imageUrl,
            ativo: true,
          });

        if (error) throw error;

        toast.success('Peça cadastrada com sucesso!');
      }

      navigate('/pecas');
    } catch (error) {
      console.error('Erro ao cadastrar peça:', error);
      toast.error('Erro ao cadastrar peça');
    }
  };

  const pecasAprovadas = pecasEncontradas.filter(peca => peca.aprovada);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Nova Peça</h1>
            <p className="text-gray-600 mt-1">
              Faça upload da nota fiscal ou comprovante para extrair dados automaticamente
            </p>
          </div>

          {/* Upload de Imagem */}
          <div className="space-y-4 mb-8">
            <label className="block text-sm font-medium text-gray-700">
              Imagem da Nota Fiscal
            </label>
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p>Analisando imagem...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Clique para fazer upload</span> ou arraste a imagem
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG ou WebP (máx. 10MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isAnalyzing}
                />
              </label>
            </div>
          </div>

          {/* Modo Múltiplas Peças */}
          {modoMultiplo && pecasEncontradas.length > 0 && (
            <div className="space-y-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      {pecasEncontradas.length} peças encontradas na nota fiscal
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={aprovarTodas}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Aprovar Todas
                    </button>
                    <button
                      type="button"
                      onClick={reprovarTodas}
                      className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reprovar Todas
                    </button>
                  </div>
                </div>
                
                {resultadoAnalise && (
                  <div className="text-sm text-blue-700 mb-4">
                    <p><strong>Fornecedor:</strong> {resultadoAnalise.fornecedor_geral}</p>
                    <p><strong>Frete Total:</strong> R$ {resultadoAnalise.frete_total.toFixed(2)}</p>
                    <p><strong>Peças Aprovadas:</strong> {pecasAprovadas.length} de {pecasEncontradas.length}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {pecasEncontradas.map((peca) => (
                  <div
                    key={peca.id}
                    className={`border rounded-lg p-4 ${
                      peca.aprovada ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={peca.aprovada}
                          onChange={() => toggleAprovacao(peca.id)}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{peca.nome}</h3>
                          <p className="text-sm text-gray-600">
                            Qtd: {peca.quantidade} | Unitário: R$ {peca.valor_unitario?.toFixed(2)} | 
                            Total: R$ {peca.valor_total?.toFixed(2)} | Frete: R$ {peca.frete.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleEdicao(peca.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removerPeca(peca.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {peca.editando && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                          <input
                            type="text"
                            value={peca.nome}
                            onChange={(e) => atualizarPeca(peca.id, 'nome', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Preço de Custo</label>
                          <input
                            type="number"
                            step="0.01"
                            value={peca.preco_custo}
                            onChange={(e) => atualizarPeca(peca.id, 'preco_custo', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Frete</label>
                          <input
                            type="number"
                            step="0.01"
                            value={peca.frete}
                            onChange={(e) => atualizarPeca(peca.id, 'frete', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Fornecedor</label>
                          <input
                            type="text"
                            value={peca.fornecedor || ''}
                            onChange={(e) => atualizarPeca(peca.id, 'fornecedor', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/pecas')}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onSubmit({} as PecaForm)}
                  disabled={isSubmitting || pecasAprovadas.length === 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    `Cadastrar ${pecasAprovadas.length} Peças Aprovadas`
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Modo Peça Única */}
          {!modoMultiplo && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Peça *
                  </label>
                  <input
                    type="text"
                    {...register('nome')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: Tela LCD iPhone 12"
                  />
                  {errors.nome && (
                    <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço de Custo *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('preco_custo', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    {errors.preco_custo && (
                      <p className="mt-1 text-sm text-red-600">{errors.preco_custo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frete
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('frete', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    {errors.frete && (
                      <p className="mt-1 text-sm text-red-600">{errors.frete.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    {...register('fornecedor')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    {...register('observacoes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Observações adicionais sobre a peça"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/pecas')}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isAnalyzing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    'Cadastrar Peça'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
