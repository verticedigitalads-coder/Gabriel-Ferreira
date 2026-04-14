-- =============================================================================
-- Fase 11 — Etapa 1: Auditoria RLS e preparação multi-empresa
-- Gerado em: 2026-04-13
-- INSTRUÇÃO: Execute este arquivo no Supabase Dashboard → SQL Editor
-- NÃO executar parcialmente — rodar tudo de uma vez
-- =============================================================================

-- -----------------------------------------------------------------------------
-- BLOCO 0: QUERIES DE AUDITORIA
-- (Executar antes para confirmar estado atual — não fazem alterações)
-- -----------------------------------------------------------------------------

/*
-- [A] Todas as tabelas públicas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- [B] Auditoria workspace_id + RLS por tabela
SELECT
  t.tablename,
  CASE WHEN c.column_name IS NOT NULL THEN '✅' ELSE '❌' END AS has_workspace_id,
  CASE WHEN t.rowsecurity THEN '✅' ELSE '❌' END AS rls_enabled
FROM pg_tables t
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = t.tablename
  AND c.column_name = 'workspace_id'
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- [C] Todas as policies existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- -----------------------------------------------------------------------------
-- BLOCO 1: workspaces — adicionar coluna segment
-- -----------------------------------------------------------------------------

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'metalurgica';

-- -----------------------------------------------------------------------------
-- BLOCO 2: workspaces — RLS (owner só acessa o próprio workspace)
-- -----------------------------------------------------------------------------

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspaces' AND policyname = 'workspace_owner_access'
  ) THEN
    CREATE POLICY "workspace_owner_access" ON workspaces
      FOR ALL
      USING (
        id IN (
          SELECT workspace_id FROM workspace_members
          WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        id IN (
          SELECT workspace_id FROM workspace_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 3: workspace_members — RLS (cada usuário vê apenas seus vínculos)
-- -----------------------------------------------------------------------------

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspace_members' AND policyname = 'self_access'
  ) THEN
    CREATE POLICY "self_access" ON workspace_members
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 4: leads
-- -----------------------------------------------------------------------------

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'workspace_isolation'
  ) THEN
    CREATE POLICY "workspace_isolation" ON leads
      FOR ALL
      USING (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      )
      WITH CHECK (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 5: orcamentos
-- -----------------------------------------------------------------------------

ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orcamentos' AND policyname = 'workspace_isolation'
  ) THEN
    CREATE POLICY "workspace_isolation" ON orcamentos
      FOR ALL
      USING (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      )
      WITH CHECK (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 6: transactions
-- -----------------------------------------------------------------------------

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'workspace_isolation'
  ) THEN
    CREATE POLICY "workspace_isolation" ON transactions
      FOR ALL
      USING (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      )
      WITH CHECK (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 7: notas
-- -----------------------------------------------------------------------------

ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notas' AND policyname = 'workspace_isolation'
  ) THEN
    CREATE POLICY "workspace_isolation" ON notas
      FOR ALL
      USING (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      )
      WITH CHECK (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 8: operacional_tasks
-- -----------------------------------------------------------------------------

ALTER TABLE operacional_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'operacional_tasks' AND policyname = 'workspace_isolation'
  ) THEN
    CREATE POLICY "workspace_isolation" ON operacional_tasks
      FOR ALL
      USING (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      )
      WITH CHECK (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 9: fornecedores
-- -----------------------------------------------------------------------------

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fornecedores' AND policyname = 'workspace_isolation'
  ) THEN
    CREATE POLICY "workspace_isolation" ON fornecedores
      FOR ALL
      USING (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      )
      WITH CHECK (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 10: materiais
-- -----------------------------------------------------------------------------

ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'materiais' AND policyname = 'workspace_isolation'
  ) THEN
    CREATE POLICY "workspace_isolation" ON materiais
      FOR ALL
      USING (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      )
      WITH CHECK (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 11: cotacoes_materiais
-- -----------------------------------------------------------------------------

ALTER TABLE cotacoes_materiais ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cotacoes_materiais' AND policyname = 'workspace_isolation'
  ) THEN
    CREATE POLICY "workspace_isolation" ON cotacoes_materiais
      FOR ALL
      USING (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      )
      WITH CHECK (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 12: consumo_materiais
-- -----------------------------------------------------------------------------

ALTER TABLE consumo_materiais ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'consumo_materiais' AND policyname = 'workspace_isolation'
  ) THEN
    CREATE POLICY "workspace_isolation" ON consumo_materiais
      FOR ALL
      USING (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      )
      WITH CHECK (
        workspace_id = (
          SELECT wm.workspace_id FROM workspace_members wm
          WHERE wm.user_id = auth.uid() LIMIT 1
        )
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BLOCO 13: contas_receber — já tem RLS, mas garantir idempotência
-- (A policy existente usa nome diferente — não recriar para não conflitar)
-- -----------------------------------------------------------------------------

-- contas_receber já possui:
-- ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY; ✅
-- CREATE POLICY "workspace members can manage contas_receber" ✅
-- Nenhuma ação necessária.

-- =============================================================================
-- FIM DA MIGRATION
-- Após executar, rodar as queries do BLOCO 0 para confirmar:
-- - 10 tabelas com ✅ RLS enabled
-- - Policies listadas em pg_policies para cada tabela
-- - workspaces com coluna segment
-- =============================================================================
