export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nome: string
          telefone: string
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          telefone: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string
          email?: string | null
          created_at?: string
        }
        Relationships: []
      }
      dispositivos: {
        Row: {
          id: string
          marca: string
          modelo: string
          imei: string | null
          serial: string | null
          senha: string | null
          condicao_externa: string
          ordem_servico_id: string
          created_at: string
        }
        Insert: {
          id?: string
          marca: string
          modelo: string
          imei?: string | null
          serial?: string | null
          senha?: string | null
          condicao_externa: string
          ordem_servico_id: string
          created_at?: string
        }
        Update: {
          id?: string
          marca?: string
          modelo?: string
          imei?: string | null
          serial?: string | null
          senha?: string | null
          condicao_externa?: string
          ordem_servico_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispositivos_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          }
        ]
      }
      acessorios: {
        Row: {
          id: string
          nome: string
          dispositivo_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          dispositivo_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          dispositivo_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acessorios_dispositivo_id_fkey"
            columns: ["dispositivo_id"]
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          }
        ]
      }
      categorias_checklist: {
        Row: {
          id: string
          titulo: string
          created_at: string
        }
        Insert: {
          id?: string
          titulo: string
          created_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          created_at?: string
        }
        Relationships: []
      }
      itens_checklist: {
        Row: {
          id: string
          descricao: string
          categoria_id: string
          created_at: string
        }
        Insert: {
          id?: string
          descricao: string
          categoria_id: string
          created_at?: string
        }
        Update: {
          id?: string
          descricao?: string
          categoria_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_checklist_categoria_id_fkey"
            columns: ["categoria_id"]
            referencedRelation: "categorias_checklist"
            referencedColumns: ["id"]
          }
        ]
      }
      ordens_servico: {
        Row: {
          id: string
          data_entrada: string
          data_atualizacao: string | null
          cliente_id: string
          problema_relatado: string
          tecnico_responsavel: string
          status: string
          observacoes_internas: string | null
          localizacao_fisica: string | null
          created_at: string
        }
        Insert: {
          id?: string
          data_entrada?: string
          data_atualizacao?: string | null
          cliente_id: string
          problema_relatado: string
          tecnico_responsavel: string
          status?: string
          observacoes_internas?: string | null
          localizacao_fisica?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          data_entrada?: string
          data_atualizacao?: string | null
          cliente_id?: string
          problema_relatado?: string
          tecnico_responsavel?: string
          status?: string
          observacoes_internas?: string | null
          localizacao_fisica?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      verificacoes_checklist: {
        Row: {
          id: string
          ordem_servico_id: string
          item_checklist_id: string
          verificado: boolean
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ordem_servico_id: string
          item_checklist_id: string
          verificado: boolean
          observacao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ordem_servico_id?: string
          item_checklist_id?: string
          verificado?: boolean
          observacao?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verificacoes_checklist_item_checklist_id_fkey"
            columns: ["item_checklist_id"]
            referencedRelation: "itens_checklist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verificacoes_checklist_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
