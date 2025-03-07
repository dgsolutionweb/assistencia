import { supabase } from '../config/supabase';
import { Dispositivo } from '../types';

export const dispositivoService = {
  /**
   * Cria um novo dispositivo associado a uma ordem de serviço
   */
  async criar(dispositivo: Omit<Dispositivo, 'id'>, ordemServicoId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('dispositivos')
      .insert({
        marca: dispositivo.marca,
        modelo: dispositivo.modelo,
        imei: dispositivo.imei || null,
        serial: dispositivo.serial || null,
        senha: dispositivo.senha || null,
        condicao_externa: dispositivo.condicaoExterna,
        ordem_servico_id: ordemServicoId
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar dispositivo:', error);
      return null;
    }

    const dispositivoId = data.id;

    // Adiciona os acessórios
    if (dispositivo.acessorios && dispositivo.acessorios.length > 0) {
      const acessoriosParaInserir = dispositivo.acessorios.map(acessorio => ({
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

    return dispositivoId;
  },

  /**
   * Busca um dispositivo pelo ID
   */
  async buscarPorId(id: string): Promise<Dispositivo | null> {
    const { data: dispositivo, error: dispositivoError } = await supabase
      .from('dispositivos')
      .select('*')
      .eq('id', id)
      .single();

    if (dispositivoError) {
      console.error('Erro ao buscar dispositivo:', dispositivoError);
      return null;
    }

    // Busca os acessórios
    const { data: acessorios, error: acessoriosError } = await supabase
      .from('acessorios')
      .select('nome')
      .eq('dispositivo_id', id);

    if (acessoriosError) {
      console.error('Erro ao buscar acessórios:', acessoriosError);
      return null;
    }

    return {
      marca: dispositivo.marca,
      modelo: dispositivo.modelo,
      imei: dispositivo.imei || undefined,
      serial: dispositivo.serial || undefined,
      senha: dispositivo.senha || undefined,
      condicaoExterna: dispositivo.condicao_externa,
      acessorios: acessorios.map(a => a.nome)
    };
  },

  /**
   * Busca um dispositivo pela ordem de serviço
   */
  async buscarPorOrdemServico(ordemServicoId: string): Promise<Dispositivo | null> {
    const { data: dispositivo, error: dispositivoError } = await supabase
      .from('dispositivos')
      .select('*')
      .eq('ordem_servico_id', ordemServicoId)
      .single();

    if (dispositivoError) {
      console.error('Erro ao buscar dispositivo por ordem de serviço:', dispositivoError);
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

    return {
      marca: dispositivo.marca,
      modelo: dispositivo.modelo,
      imei: dispositivo.imei || undefined,
      serial: dispositivo.serial || undefined,
      senha: dispositivo.senha || undefined,
      condicaoExterna: dispositivo.condicao_externa,
      acessorios: acessorios.map(a => a.nome)
    };
  },

  /**
   * Atualiza um dispositivo
   */
  async atualizar(id: string, dispositivo: Partial<Dispositivo>): Promise<boolean> {
    const { error } = await supabase
      .from('dispositivos')
      .update({
        marca: dispositivo.marca,
        modelo: dispositivo.modelo,
        imei: dispositivo.imei || null,
        serial: dispositivo.serial || null,
        senha: dispositivo.senha || null,
        condicao_externa: dispositivo.condicaoExterna
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar dispositivo:', error);
      return false;
    }

    // Se houver acessórios para atualizar
    if (dispositivo.acessorios) {
      // Remove os acessórios atuais
      const { error: deleteError } = await supabase
        .from('acessorios')
        .delete()
        .eq('dispositivo_id', id);

      if (deleteError) {
        console.error('Erro ao remover acessórios antigos:', deleteError);
        return false;
      }

      // Adiciona os novos acessórios
      if (dispositivo.acessorios.length > 0) {
        const acessoriosParaInserir = dispositivo.acessorios.map(acessorio => ({
          nome: acessorio,
          dispositivo_id: id
        }));

        const { error: insertError } = await supabase
          .from('acessorios')
          .insert(acessoriosParaInserir);

        if (insertError) {
          console.error('Erro ao adicionar novos acessórios:', insertError);
          return false;
        }
      }
    }

    return true;
  }
};
