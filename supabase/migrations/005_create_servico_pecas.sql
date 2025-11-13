-- Tabela de junção entre serviços e peças
CREATE TABLE IF NOT EXISTS public.servico_pecas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  custo DECIMAL(10,2) NOT NULL DEFAULT 0,
  frete DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servico_pecas_servico_id ON public.servico_pecas(servico_id);
CREATE INDEX IF NOT EXISTS idx_servico_pecas_peca_id ON public.servico_pecas(peca_id);

ALTER TABLE public.servico_pecas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view servico_pecas" ON public.servico_pecas;
DROP POLICY IF EXISTS "Users can insert servico_pecas" ON public.servico_pecas;
DROP POLICY IF EXISTS "Users can update servico_pecas" ON public.servico_pecas;
DROP POLICY IF EXISTS "Users can delete servico_pecas" ON public.servico_pecas;

CREATE POLICY "Users can view servico_pecas" ON public.servico_pecas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.servicos s WHERE s.id = servico_id AND s.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert servico_pecas" ON public.servico_pecas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servicos s WHERE s.id = servico_id AND s.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update servico_pecas" ON public.servico_pecas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.servicos s WHERE s.id = servico_id AND s.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete servico_pecas" ON public.servico_pecas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.servicos s WHERE s.id = servico_id AND s.usuario_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_servico_pecas_updated_at
  BEFORE UPDATE ON public.servico_pecas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

