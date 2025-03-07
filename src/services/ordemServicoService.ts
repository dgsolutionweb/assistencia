import { supabase } from '../config/supabase';
import { OrdemServico, StatusOrdemServico, Cliente, Dispositivo, CategoriaChecklist } from '../types';
import { clienteService } from './clienteService';
import { dispositivoService } from './dispositivoService';
import { categoriaChecklistService } from './categoriaChecklistService';
import { verificacaoChecklistService } from './verificacaoChecklistService';

export const ordemServicoService = {
  /**
   * Cria uma nova ordem de serviço com cliente, dispositivo e verificações
   */
  async criar(dados: {
    cliente: Omit<Cliente, 'id'>,
    dispositivo: Omit<Dispositivo, 'id'>,
    problemaRelatado: string,
    tecnicoResponsavel: string
  }): Promise<OrdemServico | null> {
    // Inicia uma transação
    const { data: clienteData, error: clienteError } = await supabase
      .from('clientes')
      .insert({
        nome: dados.cliente.nome,
        telefone: dados.cliente.telefone,
        email: dados.cliente.email || null
      })
      .select()
      .single();

    if (clienteError) {
      console.error('Erro ao criar cliente:', clienteError);
      return null;
    }

    const clienteId = clienteData.id;

    // Cria a ordem de serviço
    const { data: ordemData, error: ordemError } = await supabase
      .from('ordens_servico')
      .insert({
        cliente_id: clienteId,
        problema_relatado: dados.problemaRelatado,
        tecnico_responsavel: dados.tecnicoResponsavel,
        data_entrada: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        status: 'aguardando'
      })
      .select()
      .single();

    if (ordemError) {
      console.error('Erro ao criar ordem de serviço:', ordemError);
      return null;
    }

    const ordemId = ordemData.id;

    // Cria o dispositivo
    const { data: dispositivoData, error: dispositivoError } = await supabase
      .from('dispositivos')
      .insert({
        marca: dados.dispositivo.marca,
        modelo: dados.dispositivo.modelo,
        imei: dados.dispositivo.imei || null,
        serial: dados.dispositivo.serial || null,
        senha: dados.dispositivo.senha || null,
        condicao_externa: dados.dispositivo.condicaoExterna,
        ordem_servico_id: ordemId
      })
      .select()
      .single();

    if (dispositivoError) {
      console.error('Erro ao criar dispositivo:', dispositivoError);
      return null;
    }

    const dispositivoId = dispositivoData.id;

    // Adiciona acessórios
    if (dados.dispositivo.acessorios && dados.dispositivo.acessorios.length > 0) {
      const acessoriosParaInserir = dados.dispositivo.acessorios.map(acessorio => ({
        nome: acessorio,
        dispositivo_id: dispositivoId
      }));

      const { error: acessoriosError } = await supabase
        .from('acessorios')
        .insert(acessoriosParaInserir);

      if (acessoriosError) {
        console.error('Erro ao adicionar acessórios:', acessoriosError);
      }
    }

    // Busca as categorias e itens de checklist padrão
    const categorias = await categoriaChecklistService.listarTodosComItens();

    // Cria as verificações iniciais (todas como não verificadas)
    for (const categoria of categorias) {
      for (const item of categoria.itens) {
        await verificacaoChecklistService.criar({
          ordem_servico_id: ordemId,
          item_checklist_id: item.id,
          verificado: false
        });
      }
    }

    // Retorna a ordem de serviço completa
    return this.buscarPorId(ordemId);
  },

  /**
   * Busca uma ordem de serviço pelo ID com todos os relacionamentos
   */
  async buscarPorId(id: string): Promise<OrdemServico | null> {
    // Busca a ordem de serviço
    const { data: ordem, error: ordemError } = await supabase
      .from('ordens_servico')
      .select('*, cliente:cliente_id(*)')
      .eq('id', id)
      .single();

    if (ordemError) {
      console.error('Erro ao buscar ordem de serviço:', ordemError);
      return null;
    }

    // Busca o dispositivo
    const { data: dispositivo, error: dispositivoError } = await supabase
      .from('dispositivos')
      .select('*')
      .eq('ordem_servico_id', id)
      .single();

    if (dispositivoError) {
      console.error('Erro ao buscar dispositivo:', dispositivoError);
      return null;
    }

    // Busca os acessórios
    const { data: acessorios, error: acessoriosError } = await supabase
      .from('acessorios')
      .select('nome')
      .eq('dispositivo_id', dispositivo.id);

    if (acessoriosError) {
      console.error('Erro ao buscar acessórios:', acessoriosError);
      return null;
    }

    // Busca as categorias e itens de checklist
    const categorias = await categoriaChecklistService.listarTodosComItens();

    // Busca as verificações para esta ordem
    const { data: verificacoes, error: verificacoesError } = await supabase
      .from('verificacoes_checklist')
      .select('*, item_checklist:item_checklist_id(*)')
      .eq('ordem_servico_id', id);

    if (verificacoesError) {
      console.error('Erro ao buscar verificações:', verificacoesError);
      return null;
    }

    // Organiza as verificações por categoria
    const categoriasComVerificacoes: CategoriaChecklist[] = categorias.map(categoria => {
      const itensVerificados = categoria.itens.map(item => {
        const verificacao = verificacoes.find(v => v.item_checklist.id === item.id);
        return {
          id: item.id,
          descricao: item.descricao,
          verificado: verificacao ? verificacao.verificado : false,
          observacao: verificacao?.observacao || undefined
        };
      });

      return {
        ...categoria,
        itens: itensVerificados
      };
    });

    // Monta o objeto completo
    return {
      id: ordem.id,
      dataEntrada: new Date(ordem.data_entrada),
      dataAtualizacao: ordem.data_atualizacao ? new Date(ordem.data_atualizacao) : undefined,
      cliente: {
        id: ordem.cliente.id,
        nome: ordem.cliente.nome,
        telefone: ordem.cliente.telefone,
        email: ordem.cliente.email || undefined
      },
      dispositivo: {
        id: dispositivo.id,
        marca: dispositivo.marca,
        modelo: dispositivo.modelo,
        imei: dispositivo.imei || undefined,
        serial: dispositivo.serial || undefined,
        senha: dispositivo.senha || undefined,
        condicaoExterna: dispositivo.condicao_externa,
        acessorios: acessorios.map(a => a.nome)
      },
      categorias: categoriasComVerificacoes,
      problemaRelatado: ordem.problema_relatado,
      tecnicoResponsavel: ordem.tecnico_responsavel,
      status: ordem.status as StatusOrdemServico,
      observacoesInternas: ordem.observacoes_internas || undefined,
      localizacaoFisica: ordem.localizacao_fisica || undefined
    };
  },

  /**
   * Lista todas as ordens de serviço
   */
  async listarTodas(): Promise<OrdemServico[]> {
    try {
      console.log('Iniciando busca de ordens de serviço...');
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          cliente:cliente_id(*)
        `)
        .order('data_atualizacao', { ascending: false });

      if (error) {
        console.error('Erro ao listar ordens de serviço:', error);
        throw new Error(`Erro ao listar ordens de serviço: ${JSON.stringify(error)}`);
      }

      if (!data || data.length === 0) {
        console.log('Nenhuma ordem de serviço encontrada');
        return [];
      }

      console.log(`Encontradas ${data.length} ordens de serviço`);

      // Para cada ordem, busca o dispositivo e outros dados relacionados
      const ordens: OrdemServico[] = [];
      
      for (const ordem of data) {
        try {
          // Busca o dispositivo
          const { data: dispositivo, error: dispError } = await supabase
            .from('dispositivos')
            .select('*')
            .eq('ordem_servico_id', ordem.id)
            .single();

          if (dispError) {
            console.error(`Erro ao buscar dispositivo para ordem ${ordem.id}:`, dispError);
            continue;
          }

          if (!dispositivo) {
            console.error(`Dispositivo não encontrado para ordem ${ordem.id}`);
            continue;
          }

          // Busca os acessórios
          const { data: acessorios, error: acessError } = await supabase
            .from('acessorios')
            .select('nome')
            .eq('dispositivo_id', dispositivo.id);

          if (acessError) {
            console.error(`Erro ao buscar acessórios para dispositivo ${dispositivo.id}:`, acessError);
          }

          // Busca as categorias de checklist
          const categorias = await categoriaChecklistService.listarTodosComItens();
          
          // Busca as verificações para esta ordem
          const verificacoes = await verificacaoChecklistService.buscarPorOrdemServico(ordem.id);
          
          // Mapeia as verificações para os itens de checklist
          const categoriasComVerificacoes = categorias.map(categoria => ({
            ...categoria,
            itens: categoria.itens.map(item => {
              const verificacao = verificacoes.find(v => v.item_checklist_id === item.id);
              return {
                ...item,
                verificado: verificacao ? verificacao.verificado : false,
                observacao: verificacao ? verificacao.observacao : undefined
              };
            })
          }));

          // Constrói o objeto de ordem completo
          ordens.push({
            id: ordem.id,
            cliente: {
              id: ordem.cliente.id,
              nome: ordem.cliente.nome,
              telefone: ordem.cliente.telefone,
              email: ordem.cliente.email || undefined
            },
            dispositivo: {
              id: dispositivo.id,
              marca: dispositivo.marca,
              modelo: dispositivo.modelo,
              imei: dispositivo.imei || undefined,
              serial: dispositivo.serial || undefined,
              senha: dispositivo.senha || undefined,
              condicaoExterna: dispositivo.condicao_externa,
              acessorios: acessorios ? acessorios.map(a => a.nome) : []
            },
            problemaRelatado: ordem.problema_relatado,
            tecnicoResponsavel: ordem.tecnico_responsavel,
            status: ordem.status as StatusOrdemServico,
            localizacaoFisica: ordem.localizacao_fisica || undefined,
            dataEntrada: new Date(ordem.data_entrada),
            dataAtualizacao: ordem.data_atualizacao ? new Date(ordem.data_atualizacao) : undefined,
            categorias: categoriasComVerificacoes
          });
        } catch (ordemError) {
          console.error(`Erro ao processar ordem ${ordem.id}:`, ordemError);
          // Continua para a próxima ordem em caso de erro
        }
      }

      return ordens;
    } catch (error) {
      console.error('Erro crítico ao listar ordens de serviço:', error);
      throw error;
    }
  },

  /**
   * Filtra ordens de serviço por status
   */
  async filtrarPorStatus(status: StatusOrdemServico): Promise<OrdemServico[]> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('status', status)
      .order('data_atualizacao', { ascending: false });

    if (error) {
      console.error(`Erro ao filtrar ordens por status ${status}:`, error);
      return [];
    }

    // Para cada ordem, busca os detalhes completos
    const ordens: OrdemServico[] = [];
    
    for (const ordem of data) {
      const ordemCompleta = await this.buscarPorId(ordem.id);
      if (ordemCompleta) {
        ordens.push(ordemCompleta);
      }
    }

    return ordens;
  },

  /**
   * Atualiza uma ordem de serviço
   */
  async atualizar(id: string, dados: Partial<OrdemServico>): Promise<boolean> {
    try {
      // Primeiro, verifica se a ordem existe
      const { data: ordemExistente, error: erroConsulta } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('id', id)
        .single();

      if (erroConsulta) {
        console.error('Erro ao verificar ordem existente:', erroConsulta);
        return false;
      }

      if (!ordemExistente) {
        console.error('Ordem não encontrada para atualização');
        return false;
      }

      // Prepara os dados para atualização
      const dadosAtualizacao: any = {
        data_atualizacao: new Date().toISOString()
      };

      // Adiciona campos que podem ser atualizados
      if (dados.problemaRelatado) dadosAtualizacao.problema_relatado = dados.problemaRelatado;
      if ('diagnostico' in dados) dadosAtualizacao.diagnostico = dados.diagnostico;
      if ('solucao' in dados) dadosAtualizacao.solucao = dados.solucao;
      if ('observacoes' in dados) dadosAtualizacao.observacoes = dados.observacoes;
      if (dados.tecnicoResponsavel) dadosAtualizacao.tecnico_responsavel = dados.tecnicoResponsavel;
      if (dados.status) dadosAtualizacao.status = dados.status;
      if (dados.observacoesInternas) dadosAtualizacao.observacoes_internas = dados.observacoesInternas;
      if (dados.localizacaoFisica) dadosAtualizacao.localizacao_fisica = dados.localizacaoFisica;
      // Verificar a propriedade correta para data de saída
      if ('dataSaida' in dados) dadosAtualizacao.data_saida = dados.dataSaida;

      // Atualiza a ordem
      const { error: erroAtualizacao } = await supabase
        .from('ordens_servico')
        .update(dadosAtualizacao)
        .eq('id', id);

      if (erroAtualizacao) {
        console.error('Erro ao atualizar ordem:', erroAtualizacao);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      return false;
    }
  },

  /**
   * Atualiza o status de uma ordem de serviço
   */
  async atualizarStatus(id: string, novoStatus: StatusOrdemServico, observacao?: string, localizacaoFisica?: string): Promise<boolean> {
    const { data: ordemAtual, error: ordemQueryError } = await supabase
      .from('ordens_servico')
      .select('observacoes_internas')
      .eq('id', id)
      .single();

    if (ordemQueryError) {
      console.error('Erro ao buscar ordem atual:', ordemQueryError);
      return false;
    }

    // Adiciona a nova observação ao histórico
    let observacoesAtualizadas = ordemAtual.observacoes_internas || '';
    if (observacao) {
      const dataHora = new Date().toLocaleString();
      observacoesAtualizadas += observacoesAtualizadas 
        ? `\n[${dataHora}] ${observacao}` 
        : `[${dataHora}] ${observacao}`;
    }

    // Atualiza o status e outras informações
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status: novoStatus,
        data_atualizacao: new Date().toISOString(),
        observacoes_internas: observacoesAtualizadas,
        localizacao_fisica: localizacaoFisica
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar status da ordem:', error);
      return false;
    }

    return true;
  }
};
