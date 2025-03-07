// Tipos para o sistema de checklist de assistência técnica

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

export interface Dispositivo {
  id?: string;
  marca: string;
  modelo: string;
  imei?: string;
  serial?: string;
  senha?: string;
  acessorios: string[];
  condicaoExterna: string;
}

export interface ItemChecklist {
  id: string;
  descricao: string;
  verificado: boolean;
  observacao?: string;
}

export interface CategoriaChecklist {
  id: string;
  titulo: string;
  itens: ItemChecklist[];
}

export type StatusOrdemServico = 
  | 'aguardando' 
  | 'em_analise' 
  | 'em_reparo' 
  | 'em_testes' 
  | 'aguardando_peca' 
  | 'concluido' 
  | 'entregue'
  | 'cancelado'
  | 'pendente';

export interface OrdemServico {
  id: string;
  dataEntrada: Date;
  dataAtualizacao?: Date;
  cliente: Cliente;
  dispositivo: Dispositivo;
  categorias: CategoriaChecklist[];
  problemaRelatado: string;
  tecnicoResponsavel: string;
  status: StatusOrdemServico;
  observacoesInternas?: string;
  localizacaoFisica?: string;
} 