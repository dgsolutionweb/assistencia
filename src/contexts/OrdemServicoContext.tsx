import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { ordemServicoService } from '../services/ordemServicoService';
import { categoriaChecklistService } from '../services/categoriaChecklistService';
import { verificacaoChecklistService } from '../services/verificacaoChecklistService';
import { OrdemServico, CategoriaChecklist, StatusOrdemServico } from '../types';
import { testarConexaoSupabase } from '../config/supabase';

interface OrdemServicoContextData {
  ordensServico: OrdemServico[];
  categoriasChecklist: CategoriaChecklist[];
  loading: boolean;
  error: string | null;
  criarOrdemServico: (ordem: Omit<OrdemServico, 'id' | 'categorias' | 'dataEntrada' | 'status' | 'dataAtualizacao'>) => Promise<OrdemServico | null>;
  atualizarOrdemServico: (id: string, dados: Partial<OrdemServico>) => Promise<boolean>;
  buscarOrdemServico: (id: string) => Promise<OrdemServico | null>;
  atualizarStatusOrdemServico: (id: string, novoStatus: StatusOrdemServico, observacao?: string, localizacaoFisica?: string) => Promise<boolean>;
  atualizarVerificacaoChecklist: (ordemId: string, itemId: string, verificado: boolean, observacao?: string) => Promise<boolean>;
  recarregarOrdensServico: () => Promise<void>;
  // Funções adicionais que estão sendo usadas em outros componentes
  obterOrdemServico: (id: string) => Promise<OrdemServico | null>;
  atualizarStatusOrdem: (id: string, novoStatus: StatusOrdemServico, observacao?: string, localizacaoFisica?: string) => Promise<boolean>;
  filtrarOrdensPorStatus: (status: StatusOrdemServico) => Promise<OrdemServico[]>;
  obterTodasOrdens: () => Promise<OrdemServico[]>;
  recarregarOrdens: () => Promise<void>;
}

interface OrdemServicoProviderProps {
  children: React.ReactNode;
}

const OrdemServicoContext = createContext<OrdemServicoContextData>({} as OrdemServicoContextData);

// Flag para controlar se já carregamos os dados iniciais
let dadosIniciaisCarregados = false;

// Função de retry com número máximo de tentativas
const retryOperation = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  let currentDelay = initialDelay;
  
  // Usando uma função de closure para evitar o problema de referência no loop
  const attemptOperation = async (attempt: number): Promise<T> => {
    try {
      console.log(`Tentativa ${attempt} de ${maxRetries}`);
      return await operation();
    } catch (error) {
      console.error(`Tentativa ${attempt} falhou:`, error);
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        // Aumenta o tempo de espera para cada tentativa
        currentDelay *= 1.5;
        return attemptOperation(attempt + 1);
      }
      throw lastError;
    }
  };
  
  return attemptOperation(1);
};

export const OrdemServicoProvider: React.FC<OrdemServicoProviderProps> = ({ children }) => {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [categoriasChecklist, setCategoriasChecklist] = useState<CategoriaChecklist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  // Função para carregar ordens de serviço
  const carregarOrdensServico = useCallback(async (): Promise<OrdemServico[]> => {
    return retryOperation(async () => {
      console.log('Carregando ordens de serviço...');
      const ordens = await ordemServicoService.listarTodas();
      console.log(`${ordens.length} ordens carregadas com sucesso`);
      return ordens;
    }, 3, 2000);
  }, []);

  // Função para carregar categorias de checklist
  const carregarCategorias = useCallback(async (): Promise<CategoriaChecklist[]> => {
    return retryOperation(async () => {
      console.log('Carregando categorias de checklist...');
      const categorias = await categoriaChecklistService.listarTodosComItens();
      console.log(`${categorias.length} categorias carregadas com sucesso`);
      return categorias;
    }, 3, 2000);
  }, []);

  // Efeito para carregar dados iniciais - executado apenas uma vez
  useEffect(() => {
    // Se os dados já foram carregados, não carrega novamente
    if (dadosIniciaisCarregados) return;
    
    const inicializarDados = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Inicializando dados da aplicação...');
        
        // Tenta inicializar as categorias padrão
        try {
          await categoriaChecklistService.inicializarCategoriasPadrao();
          console.log('Categorias padrão inicializadas');
        } catch (catError) {
          console.error('Erro ao inicializar categorias padrão:', catError);
          // Continua mesmo se falhar aqui
        }
        
        // Carrega as categorias
        const categorias = await carregarCategorias();
        setCategoriasChecklist(categorias);
        
        // Carrega as ordens de serviço
        const ordens = await carregarOrdensServico();
        setOrdensServico(ordens);
        
        console.log('Dados inicializados com sucesso');
        
        // Marca que os dados foram carregados
        dadosIniciaisCarregados = true;
      } catch (error: any) {
        console.error('Erro ao carregar dados iniciais:', error);
        setError(error?.message || 'Erro desconhecido ao carregar dados');
        enqueueSnackbar('Erro ao carregar dados. Verifique a conexão com o Supabase.', { 
          variant: 'error',
          autoHideDuration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    inicializarDados();
  // Removendo as dependências que causam o loop - só executamos esse efeito uma vez
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function criarOrdemServico(novaOrdem: Omit<OrdemServico, 'id' | 'categorias' | 'dataEntrada' | 'status' | 'dataAtualizacao'>): Promise<OrdemServico | null> {
    try {
      setLoading(true);
      const ordem = await ordemServicoService.criar(novaOrdem);
      if (ordem) {
        setOrdensServico(prev => [ordem, ...prev]);
        enqueueSnackbar('Ordem de serviço criada com sucesso!', { variant: 'success' });
        return ordem;
      }
      return null;
    } catch (error: any) {
      console.error('Erro ao criar ordem de serviço:', error);
      enqueueSnackbar(`Erro ao criar ordem de serviço: ${error.message}`, { variant: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function atualizarOrdemServico(id: string, dados: Partial<OrdemServico>): Promise<boolean> {
    try {
      setLoading(true);
      const sucesso = await ordemServicoService.atualizar(id, dados);
      if (sucesso) {
        // Atualiza a ordem no estado
        setOrdensServico(prev => prev.map(ordem => 
          ordem.id === id ? { ...ordem, ...dados } : ordem
        ));
        enqueueSnackbar('Ordem de serviço atualizada com sucesso!', { variant: 'success' });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      enqueueSnackbar(`Erro ao atualizar ordem de serviço: ${error.message}`, { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function buscarOrdemServico(id: string): Promise<OrdemServico | null> {
    try {
      setLoading(true);
      return await ordemServicoService.buscarPorId(id);
    } catch (error: any) {
      console.error('Erro ao buscar ordem de serviço:', error);
      enqueueSnackbar(`Erro ao buscar ordem de serviço: ${error.message}`, { variant: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function atualizarStatusOrdemServico(id: string, novoStatus: StatusOrdemServico, observacao?: string, localizacaoFisica?: string): Promise<boolean> {
    try {
      setLoading(true);
      const sucesso = await ordemServicoService.atualizarStatus(id, novoStatus, observacao, localizacaoFisica);
      if (sucesso) {
        // Atualiza a ordem no estado
        setOrdensServico(prev => prev.map(ordem => 
          ordem.id === id ? { 
            ...ordem, 
            status: novoStatus,
            localizacaoFisica: localizacaoFisica !== undefined ? localizacaoFisica : ordem.localizacaoFisica 
          } : ordem
        ));
        enqueueSnackbar(`Status atualizado para ${novoStatus}!`, { variant: 'success' });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      enqueueSnackbar(`Erro ao atualizar status: ${error.message}`, { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function atualizarVerificacaoChecklist(
    ordemId: string, 
    itemId: string, 
    verificado: boolean, 
    observacao?: string
  ): Promise<boolean> {
    try {
      setLoading(true);
      const sucesso = await verificacaoChecklistService.atualizarVerificacao(ordemId, itemId, verificado, observacao);

      if (sucesso) {
        // Atualiza a ordem no estado
        const ordemAtualizada = await ordemServicoService.buscarPorId(ordemId);
        if (ordemAtualizada) {
          setOrdensServico(prev => prev.map(ordem => 
            ordem.id === ordemId ? ordemAtualizada : ordem
          ));
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao atualizar verificação:', error);
      enqueueSnackbar(`Erro ao atualizar verificação: ${error.message}`, { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }

  const recarregarOrdensServico = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const ordens = await carregarOrdensServico();
      setOrdensServico(ordens);
      enqueueSnackbar('Ordens de serviço atualizadas!', { variant: 'success' });
    } catch (error: any) {
      console.error('Erro ao recarregar ordens:', error);
      enqueueSnackbar(`Erro ao recarregar ordens: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [carregarOrdensServico, enqueueSnackbar]);

  // Funções adicionais para compatibilidade com os componentes existentes
  const obterOrdemServico = buscarOrdemServico;
  const atualizarStatusOrdem = atualizarStatusOrdemServico;
  const filtrarOrdensPorStatus = useCallback(async (status: StatusOrdemServico): Promise<OrdemServico[]> => {
    try {
      return await ordemServicoService.filtrarPorStatus(status);
    } catch (error) {
      console.error('Erro ao filtrar ordens por status:', error);
      return [];
    }
  }, []);
  const obterTodasOrdens = carregarOrdensServico;
  const recarregarOrdens = recarregarOrdensServico;

  return (
    <OrdemServicoContext.Provider
      value={{
        ordensServico,
        categoriasChecklist,
        loading,
        error,
        criarOrdemServico,
        atualizarOrdemServico,
        buscarOrdemServico,
        atualizarStatusOrdemServico,
        atualizarVerificacaoChecklist,
        recarregarOrdensServico,
        // Funções adicionais
        obterOrdemServico,
        atualizarStatusOrdem,
        filtrarOrdensPorStatus,
        obterTodasOrdens,
        recarregarOrdens
      }}
    >
      {children}
    </OrdemServicoContext.Provider>
  );
};

export const useOrdemServico = () => useContext(OrdemServicoContext);