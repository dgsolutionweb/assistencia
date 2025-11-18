-- Criar tabela de retiradas (salários, despesas, etc)
CREATE TABLE public.retiradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('salario', 'despesa', 'fornecedor', 'outros')),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    descricao TEXT NOT NULL,
    beneficiario VARCHAR(255), -- Nome de quem recebeu o dinheiro
    observacoes TEXT,
    data_retirada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_retiradas_usuario_id ON public.retiradas(usuario_id);
CREATE INDEX idx_retiradas_tipo ON public.retiradas(tipo);
CREATE INDEX idx_retiradas_data ON public.retiradas(data_retirada DESC);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.retiradas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS otimizadas
CREATE POLICY "Users can view own retiradas" ON public.retiradas
    FOR SELECT USING ((select auth.uid()) = usuario_id);

CREATE POLICY "Users can insert own retiradas" ON public.retiradas
    FOR INSERT WITH CHECK ((select auth.uid()) = usuario_id);

CREATE POLICY "Users can update own retiradas" ON public.retiradas
    FOR UPDATE USING ((select auth.uid()) = usuario_id);

CREATE POLICY "Users can delete own retiradas" ON public.retiradas
    FOR DELETE USING ((select auth.uid()) = usuario_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_retiradas_updated_at 
    BEFORE UPDATE ON public.retiradas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Garantir acesso completo para usuários autenticados
GRANT ALL PRIVILEGES ON TABLE public.retiradas TO authenticated;
