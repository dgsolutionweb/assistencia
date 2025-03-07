import { supabase } from '../config/supabase';
import { CategoriaChecklist, ItemChecklist } from '../types';

export const categoriaChecklistService = {
  /**
   * Lista todas as categorias de checklist
   */
  async listarTodos(): Promise<CategoriaChecklist[]> {
    const { data, error } = await supabase
      .from('categorias_checklist')
      .select('*')
      .order('titulo');

    if (error) {
      console.error('Erro ao listar categorias de checklist:', error);
      return [];
    }

    return data.map(categoria => ({
      id: categoria.id,
      titulo: categoria.titulo,
      itens: [] // Itens serão preenchidos separadamente
    }));
  },

  /**
   * Lista todas as categorias com seus itens
   */
  async listarTodosComItens(): Promise<CategoriaChecklist[]> {
    const categorias = await this.listarTodos();
    
    for (const categoria of categorias) {
      const { data: itens, error } = await supabase
        .from('itens_checklist')
        .select('*')
        .eq('categoria_id', categoria.id)
        .order('descricao');

      if (error) {
        console.error(`Erro ao buscar itens da categoria ${categoria.id}:`, error);
        continue;
      }

      categoria.itens = itens.map(item => ({
        id: item.id,
        descricao: item.descricao,
        verificado: false // Estado inicial
      }));
    }

    return categorias;
  },

  /**
   * Cria uma nova categoria de checklist
   */
  async criar(titulo: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('categorias_checklist')
      .insert({ titulo })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria de checklist:', error);
      return null;
    }

    return data.id;
  },

  /**
   * Adiciona um item a uma categoria de checklist
   */
  async adicionarItem(categoriaId: string, descricao: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('itens_checklist')
      .insert({
        descricao,
        categoria_id: categoriaId
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar item de checklist:', error);
      return null;
    }

    return data.id;
  },

  /**
   * Inicializa as categorias e itens padrão se não existirem
   */
  async inicializarCategoriasPadrao(): Promise<void> {
    // Verifica se já existem categorias
    const { count, error } = await supabase
      .from('categorias_checklist')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Erro ao verificar categorias existentes:', error);
      return;
    }

    // Se já existem categorias, não faz nada
    if (count && count > 0) {
      return;
    }

    // Categorias e itens padrão
    const categoriasPadrao = [
      {
        titulo: 'Verificação Externa',
        itens: [
          'Tela com trincas',
          'Carcaça com rachaduras',
          'Botões funcionando',
          'Portas e entradas limpas',
          'Tampa traseira danificada'
        ]
      },
      {
        titulo: 'Funcionalidades Básicas',
        itens: [
          'Liga normalmente',
          'Desliga normalmente',
          'Carrega a bateria',
          'Touch funciona corretamente',
          'Responde aos comandos'
        ]
      },
      {
        titulo: 'Hardware',
        itens: [
          'Alto-falante funcionando',
          'Microfone captando áudio',
          'Câmera frontal funcionando',
          'Câmera traseira funcionando',
          'Vibração funcionando',
          'Sensor de proximidade funcionando',
          'Leitor biométrico funcionando'
        ]
      },
      {
        titulo: 'Conectividade',
        itens: [
          'Wi-Fi conecta normalmente',
          'Bluetooth conecta normalmente',
          'Sinal de rede móvel funcionando',
          'GPS funcionando',
          'NFC funcionando (se aplicável)'
        ]
      },
      {
        titulo: 'Software',
        itens: [
          'Sistema operacional inicializando',
          'Aplicativos abrem normalmente',
          'Sem travamentos recorrentes',
          'Versão do sistema atualizada'
        ]
      }
    ];

    // Cria as categorias e itens
    for (const categoria of categoriasPadrao) {
      const categoriaId = await this.criar(categoria.titulo);
      if (categoriaId) {
        for (const itemDescricao of categoria.itens) {
          await this.adicionarItem(categoriaId, itemDescricao);
        }
      }
    }
  }
};
