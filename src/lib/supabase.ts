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
  observacoes?: string
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
        Row: Servico
        Insert: Omit<Servico, 'id' | 'lucro' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Servico, 'id' | 'lucro' | 'created_at' | 'updated_at'>>
      }
    }
  }
}