CREATE TABLE IF NOT EXISTS workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, key)
);

ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation" ON workspace_settings
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
