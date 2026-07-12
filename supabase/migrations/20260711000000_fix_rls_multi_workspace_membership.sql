-- =============================================================================
-- Fix RLS multi-workspace: troca `= (...LIMIT 1)` por `IN (...)` em 12 tabelas
-- Gerado em: 2026-07-11
--
-- Motivo: a policy original (Fase 11) usa `LIMIT 1` sem `ORDER BY`, restringindo
-- cada usuário a um único workspace arbitrário e fixo. Para usuários com 2+
-- memberships (hoje só o host), isso impede acesso aos dados de qualquer
-- workspace que não seja o escolhido arbitrariamente pelo Postgres.
--
-- Mudança estritamente aditiva: troca "só minha primeira (e arbitrária)
-- membership" por "qualquer uma das minhas memberships". Para usuários com
-- exatamente 1 membership (todos exceto o host), IN e = (...LIMIT 1) são
-- funcionalmente idênticos — zero mudança de comportamento.
--
-- Roles preservados exatamente como no original (auditado via pg_policies):
-- 11 tabelas com role `public`, `contas_receber` com role `authenticated`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- leads
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON leads;
CREATE POLICY "workspace_isolation" ON leads
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- orcamentos
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON orcamentos;
CREATE POLICY "workspace_isolation" ON orcamentos
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- recibos
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON recibos;
CREATE POLICY "workspace_isolation" ON recibos
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- transactions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON transactions;
CREATE POLICY "workspace_isolation" ON transactions
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- notas
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON notas;
CREATE POLICY "workspace_isolation" ON notas
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- materiais
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON materiais;
CREATE POLICY "workspace_isolation" ON materiais
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- fornecedores
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON fornecedores;
CREATE POLICY "workspace_isolation" ON fornecedores
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- cotacoes_materiais
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON cotacoes_materiais;
CREATE POLICY "workspace_isolation" ON cotacoes_materiais
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- consumo_materiais
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON consumo_materiais;
CREATE POLICY "workspace_isolation" ON consumo_materiais
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- operacional_tasks
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON operacional_tasks;
CREATE POLICY "workspace_isolation" ON operacional_tasks
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- workspace_settings
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace_isolation" ON workspace_settings;
CREATE POLICY "workspace_isolation" ON workspace_settings
  FOR ALL
  TO public
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- contas_receber (nome de policy diferente, role authenticated preservado)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "workspace members can manage contas_receber" ON contas_receber;
CREATE POLICY "workspace members can manage contas_receber" ON contas_receber
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_members.workspace_id FROM workspace_members
      WHERE workspace_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_members.workspace_id FROM workspace_members
      WHERE workspace_members.user_id = auth.uid()
    )
  );

-- =============================================================================
-- FIM DA MIGRATION
-- Verificação pós-apply:
-- SELECT tablename, policyname, roles, qual FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN (
--   'leads','orcamentos','recibos','transactions','notas','materiais',
--   'fornecedores','cotacoes_materiais','consumo_materiais',
--   'operacional_tasks','workspace_settings','contas_receber'
-- );
-- Esperado: todas com `qual` usando `IN (...)` sem `LIMIT`, roles inalterados.
-- =============================================================================
