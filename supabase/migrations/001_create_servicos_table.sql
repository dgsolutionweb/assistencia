-- Criar tabela de serviços
CREATE TABLE servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_aparelho VARCHAR(255) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total >= 0),
    custo_peca DECIMAL(10,2) NOT NULL CHECK (custo_peca >= 0),
    lucro DECIMAL(10,2) GENERATED ALWAYS AS (valor_total - custo_peca) STORED,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX idx_servicos_user_id ON servicos(user_id);
CREATE INDEX idx_servicos_created_at ON servicos(created_at DESC);
CREATE INDEX idx_servicos_lucro ON servicos(lucro DESC);

-- Configurar RLS (Row Level Security)
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados acessarem apenas seus próprios dados
CREATE POLICY "Users can view own servicos" ON servicos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own servicos" ON servicos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own servicos" ON servicos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own servicos" ON servicos
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_servicos_updated_at 
    BEFORE UPDATE ON servicos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Garantir acesso completo para usuários autenticados
GRANT ALL PRIVILEGES ON TABLE servicos TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;