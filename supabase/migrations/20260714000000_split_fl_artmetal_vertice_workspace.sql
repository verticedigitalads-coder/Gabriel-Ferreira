-- =============================================================================
-- Split FL Art Metal / Vértice Digital: renomeia workspace legado + cria workspace novo
-- Gerado em: 2026-07-14
--
-- Motivo: workspace 72b024c0 (nome='Vértice Digital' no banco) contém, na prática,
-- 100% dos dados e identidade da FL Art Metal (resquício single-tenant). Nenhum
-- dado é movido — só identidade de workspace muda. Ver _build/decisions.md.
--
-- Novo workspace "Vértice Digital": id fixo 001843dd-97fc-42a6-88ee-08c7a404903a
-- (gerado antecipadamente para manter a migration determinística).
--
-- Auditoria prévia (Fase 0, somente leitura): 14 tabelas multi-tenant contadas
-- em 72b024c0, busca por leads/orçamentos fora do padrão FL (teste/vertice/gabriel)
-- retornou 0 resultados — nenhum dado misto a mover/excluir antes do rename.
-- =============================================================================

-- 1. Renomeia o workspace legado para refletir seu conteúdo real
UPDATE workspaces
SET nome = 'FL Art Metal',
    owner_id = '1350a291-4916-49c5-9bf5-30737e717276'
WHERE id = '72b024c0-42e4-4113-8bb0-81ba6eb720bd';

-- 2. Cria o workspace novo, vazio, para uso interno da agência
INSERT INTO workspaces (id, nome, owner_id, segment)
VALUES ('001843dd-97fc-42a6-88ee-08c7a404903a', 'Vértice Digital', 'dd50c052-b7a3-445c-b027-2668ac83f60c', 'saas');

-- 3. Memberships: host vira admin no FL (suporte), owner no novo workspace
UPDATE workspace_members
SET role = 'admin'
WHERE workspace_id = '72b024c0-42e4-4113-8bb0-81ba6eb720bd'
  AND user_id = 'dd50c052-b7a3-445c-b027-2668ac83f60c';

INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES ('001843dd-97fc-42a6-88ee-08c7a404903a', 'dd50c052-b7a3-445c-b027-2668ac83f60c', 'owner');

-- 4. Move a instância WhatsApp pessoal de teste do Gabriel pro workspace novo
UPDATE whatsapp_instances
SET workspace_id = '001843dd-97fc-42a6-88ee-08c7a404903a'
WHERE instance_name = 'teste-gabriel';

-- =============================================================================
-- ROLLBACK (documentado, não executado):
--
-- UPDATE whatsapp_instances SET workspace_id = '72b024c0-42e4-4113-8bb0-81ba6eb720bd' WHERE instance_name = 'teste-gabriel';
-- DELETE FROM workspace_members WHERE workspace_id = '001843dd-97fc-42a6-88ee-08c7a404903a';
-- DELETE FROM workspaces WHERE id = '001843dd-97fc-42a6-88ee-08c7a404903a';
-- UPDATE workspace_members SET role = 'owner' WHERE workspace_id = '72b024c0-42e4-4113-8bb0-81ba6eb720bd' AND user_id = 'dd50c052-b7a3-445c-b027-2668ac83f60c';
-- UPDATE workspaces SET nome = 'Vértice Digital', owner_id = 'dd50c052-b7a3-445c-b027-2668ac83f60c' WHERE id = '72b024c0-42e4-4113-8bb0-81ba6eb720bd';
-- =============================================================================
