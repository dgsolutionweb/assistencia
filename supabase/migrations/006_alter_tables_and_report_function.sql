-- Adicionar colunas opcionais em servicos
ALTER TABLE public.servicos
  ADD COLUMN IF NOT EXISTS tecnico VARCHAR(255),
  ADD COLUMN IF NOT EXISTS marca VARCHAR(255),
  ADD COLUMN IF NOT EXISTS modelo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cliente VARCHAR(255),
  ADD COLUMN IF NOT EXISTS descricao_problema TEXT;

-- Adicionar colunas opcionais em pecas
ALTER TABLE public.pecas
  ADD COLUMN IF NOT EXISTS preco_venda DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(255);

-- Função de resumo de relatórios por período
CREATE OR REPLACE FUNCTION public.relatorio_resumo(
  p_uid uuid,
  p_inicio timestamptz DEFAULT NULL,
  p_fim timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_servicos integer,
  receita_total numeric,
  lucro_total numeric,
  ticket_medio numeric,
  margem_lucro numeric,
  total_pecas integer,
  servicos_este_mes integer,
  concluidos integer,
  pendentes integer,
  cancelados integer
) AS $$
BEGIN
  RETURN QUERY
  WITH filtro AS (
    SELECT *
    FROM public.servicos s
    WHERE s.usuario_id = p_uid
      AND (p_inicio IS NULL OR s.created_at >= p_inicio)
      AND (p_fim IS NULL OR s.created_at <= p_fim)
  ),
  estat AS (
    SELECT 
      COUNT(*) AS total,
      COALESCE(SUM(valor_total), 0) AS receita,
      COALESCE(SUM(lucro), 0) AS lucro,
      COUNT(*) FILTER (WHERE status = 'concluido') AS concl,
      COUNT(*) FILTER (WHERE status = 'pendente') AS pend,
      COUNT(*) FILTER (WHERE status = 'cancelado') AS canc
    FROM filtro
  ),
  pecas_count AS (
    SELECT COUNT(*) AS total
    FROM public.pecas p
    WHERE p.user_id = p_uid AND p.ativo = TRUE
  ),
  mes AS (
    SELECT COUNT(*) AS qtd
    FROM public.servicos s
    WHERE s.usuario_id = p_uid
      AND date_trunc('month', s.created_at) = date_trunc('month', NOW())
  )
  SELECT 
    estat.total::int,
    estat.receita,
    estat.lucro,
    CASE WHEN estat.total > 0 THEN estat.receita / estat.total ELSE 0 END AS ticket,
    CASE WHEN estat.receita > 0 THEN (estat.lucro / estat.receita) * 100 ELSE 0 END AS margem,
    pecas_count.total::int,
    mes.qtd::int,
    estat.concl::int,
    estat.pend::int,
    estat.canc::int
  FROM estat, pecas_count, mes;
END;
$$ LANGUAGE plpgsql STABLE;

