-- Adicionar coluna status em servicos
ALTER TABLE public.servicos
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';

-- Opcional: constraint simples para valores esperados
ALTER TABLE public.servicos
  ADD CONSTRAINT servicos_status_check CHECK (status IN ('concluido','pendente','cancelado'));

-- Índice por status para filtros
CREATE INDEX IF NOT EXISTS idx_servicos_status ON public.servicos(status);

-- Backfill: garantir valor padrão para registros existentes
UPDATE public.servicos SET status = COALESCE(status, 'pendente');

