import { supabase } from '../config/supabase';
import { Cliente } from '../types';

export const clienteService = {
  /**
   * Cria um novo cliente no Supabase
   */
  async criar(cliente: Omit<Cliente, 'id'>): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email || null
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }

    return data ? {
      id: data.id,
      nome: data.nome,
      telefone: data.telefone,
      email: data.email || undefined
    } : null;
  },

  /**
   * Busca um cliente pelo ID
   */
  async buscarPorId(id: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }

    return data ? {
      id: data.id,
      nome: data.nome,
      telefone: data.telefone,
      email: data.email || undefined
    } : null;
  },
  
  /**
   * Busca um cliente pelo telefone
   */
  async buscarPorTelefone(telefone: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefone', telefone)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // Não encontrado
        console.error('Erro ao buscar cliente por telefone:', error);
      }
      return null;
    }

    return data ? {
      id: data.id,
      nome: data.nome,
      telefone: data.telefone,
      email: data.email || undefined
    } : null;
  },

  /**
   * Lista clientes com filtros opcionais
   */
  async listarClientes(filtros?: { telefone?: string, nome?: string }): Promise<Cliente[]> {
    let query = supabase
      .from('clientes')
      .select('*');
    
    if (filtros?.telefone) {
      query = query.ilike('telefone', `%${filtros.telefone}%`);
    }
    
    if (filtros?.nome) {
      query = query.ilike('nome', `%${filtros.nome}%`);
    }
    
    const { data, error } = await query.order('nome');

    if (error) {
      console.error('Erro ao listar clientes:', error);
      return [];
    }

    return data.map(cliente => ({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || undefined
    }));
  },

  /**
   * Lista todos os clientes
   */
  async listarTodos(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Erro ao listar clientes:', error);
      return [];
    }

    return data.map(cliente => ({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || undefined
    }));
  },

  /**
   * Atualiza um cliente existente
   */
  async atualizar(id: string, cliente: Partial<Cliente>): Promise<boolean> {
    const { error } = await supabase
      .from('clientes')
      .update({
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email || null
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return false;
    }

    return true;
  },

  /**
   * Exclui um cliente
   */
  async excluir(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir cliente:', error);
      return false;
    }

    return true;
  }
};
