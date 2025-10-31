-- Criar tabela de peças
CREATE TABLE IF NOT EXISTS public.pecas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    preco_custo DECIMAL(10,2) NOT NULL DEFAULT 0,
    frete DECIMAL(10,2) NOT NULL DEFAULT 0,
    fornecedor VARCHAR(255),
    imagem_url TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pecas_user_id ON public.pecas(user_id);
CREATE INDEX IF NOT EXISTS idx_pecas_nome ON public.pecas(nome);
CREATE INDEX IF NOT EXISTS idx_pecas_fornecedor ON public.pecas(fornecedor);
CREATE INDEX IF NOT EXISTS idx_pecas_ativo ON public.pecas(ativo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver apenas suas próprias peças
CREATE POLICY "Users can view own pecas" ON public.pecas
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem inserir peças para si mesmos
CREATE POLICY "Users can insert own pecas" ON public.pecas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar apenas suas próprias peças
CREATE POLICY "Users can update own pecas" ON public.pecas
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar apenas suas próprias peças
CREATE POLICY "Users can delete own pecas" ON public.pecas
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela pecas
CREATE TRIGGER update_pecas_updated_at 
    BEFORE UPDATE ON public.pecas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();