CREATE TABLE IF NOT EXISTS recibos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  numero_recibo TEXT,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_endereco TEXT,
  descricao TEXT NOT NULL,
  itens JSONB NOT NULL DEFAULT '[]',
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_emissao DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'emitido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation" ON recibos
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

CREATE INDEX idx_recibos_workspace ON recibos(workspace_id);
CREATE INDEX idx_recibos_orcamento ON recibos(orcamento_id);
CREATE INDEX idx_recibos_status ON recibos(status);
