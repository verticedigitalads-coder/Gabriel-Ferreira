import { supabase } from '@/lib/supabase';

export interface WorkspaceSettings {
  empresaNome: string;
  empresaTelefone: string;
  empresaEmail: string;
  empresaEndereco: string;
  empresaCnpj: string;
  empresaLogoUrl: string;
  empresaLogoBgUrl: string;
  validadePadraoOrcamento: number;
  multiplicadorPadrao: number;
  percentualComissao: number;
  observacaoPadraoOrcamento: string;
  observacaoPadraoRecibo: string;
  textoApresentacao: string;
  condicoesContrato: string;
  metodosPagamento: string;
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  empresaNome: '',
  empresaTelefone: '',
  empresaEmail: '',
  empresaEndereco: '',
  empresaCnpj: '',
  empresaLogoUrl: '',
  empresaLogoBgUrl: '',
  validadePadraoOrcamento: 15,
  multiplicadorPadrao: 1,
  percentualComissao: 0,
  observacaoPadraoOrcamento: '',
  observacaoPadraoRecibo: '',
  textoApresentacao: 'Para a nossa empresa, é um prazer apresentar esta proposta. Este orçamento foi elaborado para ser o melhor investimento para você, oferecendo qualidade, durabilidade e sofisticação para seus ambientes.',
  condicoesContrato: '1. Neste orçamento já estão considerados os valores de mão de obra, materiais e frete.\n2. A validade deste orçamento é de {{validade}} dias após a emissão.\n3. Para iniciarmos o trabalho é necessário o pagamento de sinal de 50% do valor total.\n4. Em caso de desistência, após o início da produção, o valor do sinal poderá não ser restituído.\n5. Garantia conforme Código de Defesa do Consumidor.',
  metodosPagamento: 'pix,credito,debito,dinheiro,transferencia',
};

// Mapeamento camelCase → snake_case (key do banco)
const CAMEL_TO_SNAKE: Record<keyof WorkspaceSettings, string> = {
  empresaNome: 'empresa_nome',
  empresaTelefone: 'empresa_telefone',
  empresaEmail: 'empresa_email',
  empresaEndereco: 'empresa_endereco',
  empresaCnpj: 'empresa_cnpj',
  empresaLogoUrl: 'empresa_logo_url',
  empresaLogoBgUrl: 'empresa_logo_bg_url',
  validadePadraoOrcamento: 'validade_padrao_orcamento',
  multiplicadorPadrao: 'multiplicador_padrao',
  percentualComissao: 'percentual_comissao',
  observacaoPadraoOrcamento: 'observacao_padrao_orcamento',
  observacaoPadraoRecibo: 'observacao_padrao_recibo',
  textoApresentacao: 'texto_apresentacao',
  condicoesContrato: 'condicoes_contrato',
  metodosPagamento: 'metodos_pagamento',
};

// Mapeamento inverso snake_case → camelCase
const SNAKE_TO_CAMEL: Record<string, keyof WorkspaceSettings> = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE).map(([camel, snake]) => [snake, camel as keyof WorkspaceSettings]),
);

export const createSettingsSlice = (set: any, get: any) => ({
  settings: { ...DEFAULT_SETTINGS } as WorkspaceSettings,

  // ================= FETCH =================
  fetchSettings: async (workspaceId: string) => {
    if (!workspaceId) return;

    const { data, error } = await supabase
      .from('workspace_settings')
      .select('key, value')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('[SettingsSlice] Erro ao buscar settings:', error);
      return;
    }

    const merged: WorkspaceSettings = { ...DEFAULT_SETTINGS };

    for (const row of data || []) {
      const camelKey = SNAKE_TO_CAMEL[row.key];
      if (!camelKey) continue;

      const val = row.value;
      if (camelKey === 'validadePadraoOrcamento' || camelKey === 'multiplicadorPadrao' || camelKey === 'percentualComissao') {
        (merged as any)[camelKey] = Number(val) || DEFAULT_SETTINGS[camelKey];
      } else {
        (merged as any)[camelKey] = val ?? '';
      }
    }

    set({ settings: merged });
  },

  // ================= UPDATE SINGLE =================
  updateSetting: async (key: string, value: string) => {
    const { workspaceId } = get();
    if (!workspaceId) {
      console.error('[SettingsSlice] workspaceId está null');
      return;
    }

    const { error } = await supabase
      .from('workspace_settings')
      .upsert(
        { workspace_id: workspaceId, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'workspace_id,key' },
      );

    if (error) {
      console.error('[SettingsSlice] Erro ao salvar setting:', error);
      return;
    }

    // Atualiza estado local
    const camelKey = SNAKE_TO_CAMEL[key];
    if (camelKey) {
      set((state: any) => {
        const updated = { ...state.settings };
        if (camelKey === 'validadePadraoOrcamento' || camelKey === 'multiplicadorPadrao' || camelKey === 'percentualComissao') {
          (updated as any)[camelKey] = Number(value) || DEFAULT_SETTINGS[camelKey];
        } else {
          (updated as any)[camelKey] = value;
        }
        return { settings: updated };
      });
    }
  },

  // ================= UPDATE BATCH =================
  updateSettings: async (partial: Partial<WorkspaceSettings>) => {
    const { updateSetting } = get();

    for (const [camelKey, value] of Object.entries(partial)) {
      const snakeKey = CAMEL_TO_SNAKE[camelKey as keyof WorkspaceSettings];
      if (!snakeKey) continue;
      await updateSetting(snakeKey, String(value ?? ''));
    }
  },
});
