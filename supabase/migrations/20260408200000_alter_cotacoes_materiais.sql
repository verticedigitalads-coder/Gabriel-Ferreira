-- Fase 7: Adiciona material_id (FK) e data (DATE) em cotacoes_materiais
-- material_id é nullable para manter compatibilidade com registros legados que usam o campo texto "material"

ALTER TABLE cotacoes_materiais
  ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES materiais(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data DATE NOT NULL DEFAULT CURRENT_DATE;
