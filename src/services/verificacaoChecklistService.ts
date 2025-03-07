import { supabase } from '../config/supabase';

export const verificacaoChecklistService = {
  /**
   * Cria uma nova verificação de checklist
   */
  async criar(verificacao: {
    ordem_servico_id: string;
    item_checklist_id: string;
    verificado: boolean;
    observacao?: string;
  }): Promise<string | null> {
    const { data, error } = await supabase
      .from('verificacoes_checklist')
      .insert({
        ordem_servico_id: verificacao.ordem_servico_id,
        item_checklist_id: verificacao.item_checklist_id,
        verificado: verificacao.verificado,
        observacao: verificacao.observacao || null
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar verificação de checklist:', error);
      return null;
    }

    return data.id;
  },

  /**
   * Busca verificações por ordem de serviço
   */
  async buscarPorOrdemServico(ordemServicoId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('verificacoes_checklist')
      .select('*, item_checklist:item_checklist_id(*)')
      .eq('ordem_servico_id', ordemServicoId);

    if (error) {
      console.error('Erro ao buscar verificações por ordem de serviço:', error);
      return [];
    }

    return data;
  },

  /**
   * Atualiza uma verificação de checklist
   */
  async atualizar(ordemServicoId: string, itemChecklistId: string, dados: {
    verificado: boolean;
    observacao?: string;
  }): Promise<boolean> {
    // Verifica se já existe uma verificação para essa ordem e item
    const { data: existente, error: erroConsulta } = await supabase
      .from('verificacoes_checklist')
      .select('id')
      .eq('ordem_servico_id', ordemServicoId)
      .eq('item_checklist_id', itemChecklistId)
      .maybeSingle();

    if (erroConsulta) {
      console.error('Erro ao verificar existência de verificação:', erroConsulta);
      return false;
    }

    if (existente) {
      // Atualiza a verificação existente
      const { error } = await supabase
        .from('verificacoes_checklist')
        .update({
          verificado: dados.verificado,
          observacao: dados.observacao || null,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', existente.id);

      if (error) {
        console.error('Erro ao atualizar verificação:', error);
        return false;
      }

      return true;
    } else {
      // Cria uma nova verificação
      const resultado = await this.criar({
        ordem_servico_id: ordemServicoId,
        item_checklist_id: itemChecklistId,
        verificado: dados.verificado,
        observacao: dados.observacao
      });

      return resultado !== null;
    }
  },

  /**
   * Atualiza uma verificação de checklist (alias para o método atualizar)
   */
  async atualizarVerificacao(ordemId: string, itemId: string, verificado: boolean, observacao?: string): Promise<boolean> {
    return this.atualizar(ordemId, itemId, { verificado, observacao });
  }
};
