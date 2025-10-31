import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Servico {
  id: string
  nome_aparelho: string
  valor_total: number
  custo_peca: number
  lucro: number
  peca_id?: string | null
  pecas_ids?: string | null // JSON string com array de peças
  observacoes?: string
  created_at: string
  updated_at: string
  usuario_id: string
}

export interface Peca {
  id: string
  nome: string
  preco_custo: number
  frete: number
  fornecedor?: string
  imagem_url?: string
  observacoes?: string
  ativo: boolean
  created_at: string
  updated_at: string
  user_id: string
}

export interface RelatorioResumo {
  lucro_total: number
  total_servicos: number
  ticket_medio: number
  custo_medio_pecas: number
}

export interface FiltrosPeriodo {
  data_inicio?: string
  data_fim?: string
}

export interface Database {
  public: {
    Tables: {
      servicos: {
        Row: {
          id: string
          usuario_id: string
          nome_aparelho: string
          valor_total: number
          custo_peca: number
          peca_id: string | null
          pecas_ids: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          nome_aparelho: string
          valor_total: number
          custo_peca: number
          peca_id?: string | null
          pecas_ids?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          nome_aparelho?: string
          valor_total?: number
          custo_peca?: number
          peca_id?: string | null
          pecas_ids?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pecas: {
        Row: Peca
        Insert: Omit<Peca, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Peca, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}