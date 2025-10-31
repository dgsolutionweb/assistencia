import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff } from 'lucide-react';
import { supabase, type Peca } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import Empty from '../components/Empty';

export default function Pecas() {
  const { user } = useAuth();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    if (user) {
      carregarPecas();
    }
  }, [user, showInactive]);

  const carregarPecas = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('pecas')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (!showInactive) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPecas(data || []);
    } catch (error) {
      console.error('Erro ao carregar peças:', error);
      toast.error('Erro ao carregar peças');
    } finally {
      setLoading(false);
    }
  };

  const toggleAtivoPeca = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('pecas')
        .update({ ativo: !ativo })
        .eq('id', id);

      if (error) throw error;

      setPecas(pecas.map(peca => 
        peca.id === id ? { ...peca, ativo: !ativo } : peca
      ));

      toast.success(ativo ? 'Peça desativada' : 'Peça ativada');
    } catch (error) {
      console.error('Erro ao alterar status da peça:', error);
      toast.error('Erro ao alterar status da peça');
    }
  };

  const deletarPeca = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta peça?')) return;

    try {
      const { error } = await supabase
        .from('pecas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPecas(pecas.filter(peca => peca.id !== id));
      toast.success('Peça excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir peça:', error);
      toast.error('Erro ao excluir peça');
    }
  };

  const pecasFiltradas = pecas.filter(peca =>
    peca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    peca.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Peças</h1>
              <p className="text-gray-600 mt-1">
                Gerencie suas peças cadastradas
              </p>
            </div>
            <Link
              to="/pecas/nova"
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Peça
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Mostrar inativas
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de Peças */}
        {pecasFiltradas.length === 0 ? (
          <Empty
            icon={Package}
            title="Nenhuma peça encontrada"
            description={searchTerm ? "Tente ajustar os filtros de busca" : "Cadastre sua primeira peça para começar"}
            action={
              !searchTerm ? (
                <Link
                  to="/pecas/nova"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Peça
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peça
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preços
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pecasFiltradas.map((peca) => (
                    <tr key={peca.id} className={!peca.ativo ? 'opacity-60' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {peca.imagem_url && (
                            <img
                              src={peca.imagem_url}
                              alt={peca.nome}
                              className="w-10 h-10 rounded-md object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {peca.nome}
                            </div>
                            {peca.observacoes && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {peca.observacoes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Custo: R$ {peca.preco_custo.toFixed(2)}
                        </div>
                        {peca.frete > 0 && (
                          <div className="text-sm text-gray-500">
                            Frete: R$ {peca.frete.toFixed(2)}
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          Total: R$ {(peca.preco_custo + peca.frete).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {peca.fornecedor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          peca.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {peca.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(peca.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => toggleAtivoPeca(peca.id, peca.ativo)}
                            className="text-gray-400 hover:text-gray-600"
                            title={peca.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {peca.ativo ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <Link
                            to={`/pecas/${peca.id}/editar`}
                            className="text-red-600 hover:text-red-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deletarPeca(peca.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumo */}
        {pecasFiltradas.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {pecasFiltradas.length}
                </div>
                <div className="text-sm text-gray-500">
                  {pecasFiltradas.length === 1 ? 'Peça' : 'Peças'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {pecasFiltradas.reduce((acc, peca) => acc + peca.preco_custo, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Valor Total em Custo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {pecasFiltradas.reduce((acc, peca) => acc + peca.frete, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Total em Frete</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}