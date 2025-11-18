-- Corrigir vulnerabilidade de segurança na função update_updated_at_column
-- Adicionar SECURITY DEFINER e search_path fixo

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Recriar triggers que usam esta função
DROP TRIGGER IF EXISTS update_servicos_updated_at ON public.servicos;
CREATE TRIGGER update_servicos_updated_at 
    BEFORE UPDATE ON public.servicos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pecas_updated_at ON public.pecas;
CREATE TRIGGER update_pecas_updated_at 
    BEFORE UPDATE ON public.pecas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_servico_pecas_updated_at ON public.servico_pecas;
CREATE TRIGGER update_servico_pecas_updated_at 
    BEFORE UPDATE ON public.servico_pecas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
