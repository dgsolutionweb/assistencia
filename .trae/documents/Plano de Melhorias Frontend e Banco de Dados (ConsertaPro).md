## Objetivos
- Fortalecer segurança (mover IA Gemini para backend, proteger chaves).
- Melhorar experiência e performance (cache com React Query, paginação, PWA real).
- Evoluir modelo de dados (relacionamentos normalizados entre serviços e peças, índices e RLS consistentes).

## Frontend
1. Integração de cache e estados remotos
- Adotar `@tanstack/react-query` nas páginas `Servicos` e `Pecas` para listas, criação e exclusão, com invalidation por chave.
- Unificar tratamento de erro/sucesso com `sonner` e retorno estruturado.

2. Paginação e busca
- Implementar paginação server-side com `supabase.range()` nas consultas e `InfiniteScroll` funcional.
- Normalizar filtros (searchTerm, ativos) em query params para compartilhamento.

3. Segurança das chamadas de IA
- Remover uso direto de `VITE_GEMINI_API_KEY` no cliente.
- Criar uma função serverless (Vercel Functions ou Supabase Edge Function) para `analisarImagemPeca` e `analisarNotaFiscalCompleta` com chave segura.
- Atualizar `NovaPeca.tsx` para chamar a API backend.

4. PWA e performance
- Configurar `vite-plugin-pwa` no `vite.config.ts` (manifest, caching, register SW).
- Code-splitting por rota (lazy import) e prefetch de recursos críticos.

5. Consistência de tipagem
- Alinhar `Peca` e `Servico` às colunas reais do banco ou criar migrations para os campos faltantes (ex.: `preco_venda`, `codigo`, `categoria`, campos extras de `servicos`).

## Banco de Dados (Supabase)
1. Normalização de relacionamentos
- Criar tabela `servico_pecas` (`servico_id`, `peca_id`, `quantidade`, `custo`, `frete`), substituir `servicos.pecas_ids JSONB`.
- Índices em (`servico_id`), (`peca_id`) e composto conforme consultas.
- Políticas RLS por `usuario_id` (via join com dono do `servico`).

2. Migrations e políticas
- Atualizar migrations para novos campos necessários e garantir triggers de `updated_at`.
- Definir políticas do bucket `pecas-images` (leitura pública opcional, escrita restrita ao usuário).

3. Performance de consultas
- Evitar `select('*')`; solicitar apenas colunas necessárias.
- Criar views ou materializações para relatórios agregados (lucro total, ticket médio).

## Deploy/DevOps
- Ajustar `vercel.json` para rotas de funções (`/api/analyze-image`).
- Configurar variáveis de ambiente seguras no provider.
- Adicionar checks de CI (lint, type-check, build) e teste básico.

## Entregáveis
- API segura para análise de imagens.
- Paginação e cache nas listas.
- Migrations para `servico_pecas` e/ou alinhamento de schemas.
- Configuração PWA ativa.

Confirma que seguimos com este plano? 