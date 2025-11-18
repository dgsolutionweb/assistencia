-- Otimizar RLS Policies para melhor performance
-- Substituir auth.uid() por (select auth.uid()) para evitar reavaliação em cada linha

-- ========================================
-- TABELA SERVICOS
-- ========================================

DROP POLICY IF EXISTS "Users can view own servicos" ON public.servicos;
DROP POLICY IF EXISTS "Users can insert own servicos" ON public.servicos;
DROP POLICY IF EXISTS "Users can update own servicos" ON public.servicos;
DROP POLICY IF EXISTS "Users can delete own servicos" ON public.servicos;

CREATE POLICY "Users can view own servicos" ON public.servicos
    FOR SELECT USING ((select auth.uid()) = usuario_id);

CREATE POLICY "Users can insert own servicos" ON public.servicos
    FOR INSERT WITH CHECK ((select auth.uid()) = usuario_id);

CREATE POLICY "Users can update own servicos" ON public.servicos
    FOR UPDATE USING ((select auth.uid()) = usuario_id);

CREATE POLICY "Users can delete own servicos" ON public.servicos
    FOR DELETE USING ((select auth.uid()) = usuario_id);

-- ========================================
-- TABELA PECAS
-- ========================================

DROP POLICY IF EXISTS "Users can view own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users can insert own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users can update own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users can delete own pecas" ON public.pecas;

CREATE POLICY "Users can view own pecas" ON public.pecas
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own pecas" ON public.pecas
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own pecas" ON public.pecas
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own pecas" ON public.pecas
    FOR DELETE USING ((select auth.uid()) = user_id);
