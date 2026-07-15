-- =============================================================================
-- Cria tabela terms_acceptance: registro versionado de aceite dos Termos de Uso
-- e da Política de Privacidade (conformidade LGPD)
-- Gerado em: 2026-07-15
--
-- Motivo: passar a exigir aceite explícito e versionado dos documentos legais no
-- primeiro acesso autenticado. Cada linha registra que um usuário (auth.uid())
-- aceitou uma versão específica (TERMS_VERSION no frontend). UNIQUE(user_id,
-- version) torna o aceite idempotente por versão.
--
-- Escopo: USER-scoped (não workspace-scoped) — o aceite é do titular da conta,
-- independente de workspace. RLS `self_access` (user_id = auth.uid()) espelha o
-- padrão já usado em workspace_members (baseline_full_schema.sql:619): FOR ALL,
-- TO public, com USING e WITH CHECK idênticos. O usuário só insere/lê o próprio.
-- =============================================================================

CREATE TABLE IF NOT EXISTS terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, version)
);

ALTER TABLE terms_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_access" ON terms_acceptance
  FOR ALL
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_terms_acceptance_user ON terms_acceptance(user_id);

-- -----------------------------------------------------------------------------
-- ROLLBACK (documentado, não executado):
-- -----------------------------------------------------------------------------
-- DROP INDEX IF EXISTS idx_terms_acceptance_user;
-- DROP POLICY IF EXISTS "self_access" ON terms_acceptance;
-- DROP TABLE IF EXISTS terms_acceptance;

-- -----------------------------------------------------------------------------
-- Verificação pós-apply:
-- -----------------------------------------------------------------------------
-- SELECT policyname, cmd, roles, qual, with_check
--   FROM pg_policies WHERE tablename = 'terms_acceptance';
-- Esperado: 1 policy "self_access", cmd ALL, roles {public},
-- qual/with_check = (user_id = auth.uid()).
