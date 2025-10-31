-- Adicionar coluna peca_id à tabela servicos
ALTER TABLE servicos 
ADD COLUMN peca_id UUID REFERENCES pecas(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_servicos_peca_id ON servicos(peca_id);

-- Comentário da coluna
COMMENT ON COLUMN servicos.peca_id IS 'Referência à peça utilizada no serviço (opcional)';