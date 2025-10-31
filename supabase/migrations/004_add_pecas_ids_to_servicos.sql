-- Adicionar coluna pecas_ids à tabela servicos para suportar múltiplas peças
ALTER TABLE servicos 
ADD COLUMN pecas_ids JSONB;

-- Criar índice para melhor performance em consultas JSON
CREATE INDEX idx_servicos_pecas_ids ON servicos USING GIN (pecas_ids);

-- Comentário da coluna
COMMENT ON COLUMN servicos.pecas_ids IS 'Array JSON com informações das múltiplas peças utilizadas no serviço (opcional)';

-- Atualizar coluna user_id para usuario_id para consistência
ALTER TABLE servicos RENAME COLUMN user_id TO usuario_id;

-- Atualizar índices e políticas RLS
DROP INDEX IF EXISTS idx_servicos_user_id;
CREATE INDEX idx_servicos_usuario_id ON servicos(usuario_id);

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own servicos" ON servicos;
DROP POLICY IF EXISTS "Users can insert own servicos" ON servicos;
DROP POLICY IF EXISTS "Users can update own servicos" ON servicos;
DROP POLICY IF EXISTS "Users can delete own servicos" ON servicos;

-- Criar novas políticas com usuario_id
CREATE POLICY "Users can view own servicos" ON servicos
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own servicos" ON servicos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own servicos" ON servicos
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own servicos" ON servicos
    FOR DELETE USING (auth.uid() = usuario_id);