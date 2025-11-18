-- Remover índices não utilizados para melhorar performance de writes
-- Baseado na análise do Supabase Database Linter

-- Índices da tabela servicos
DROP INDEX IF EXISTS public.idx_servicos_created_at;
DROP INDEX IF EXISTS public.idx_servicos_lucro;
DROP INDEX IF EXISTS public.idx_servicos_peca_id;
DROP INDEX IF EXISTS public.idx_servicos_pecas_ids;
DROP INDEX IF EXISTS public.idx_servicos_status;

-- Índices da tabela pecas
DROP INDEX IF EXISTS public.idx_pecas_nome;
DROP INDEX IF EXISTS public.idx_pecas_fornecedor;
DROP INDEX IF EXISTS public.idx_pecas_ativo;

-- Adicionar índice importante que estava faltando
CREATE INDEX IF NOT EXISTS idx_pecas_user_id ON public.pecas(user_id);

-- Manter apenas os índices essenciais:
-- idx_servicos_user_id (já existe e é usado)
-- idx_pecas_user_id (criado acima)
-- Índices de foreign keys são criados automaticamente pelo Postgres
