import { supabase } from '@/lib/supabase';
import { TERMS_VERSION } from '@/lib/terms';

/**
 * Registro versionado de aceite dos documentos legais (LGPD).
 * Tabela `terms_acceptance` é user-scoped via RLS (user_id = auth.uid()).
 */

/**
 * Retorna true se o usuário já registrou aceite da versão vigente (TERMS_VERSION).
 * **Lança** em caso de erro de rede/consulta — o gate trata como fail-closed
 * (nunca libera o app sem uma resposta afirmativa do banco).
 */
export async function hasAcceptedCurrentTerms(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('terms_acceptance')
    .select('id')
    .eq('user_id', userId)
    .eq('version', TERMS_VERSION)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * Registra o aceite da versão vigente. Idempotente por UNIQUE(user_id, version):
 * um segundo aceite da mesma versão (corrida/duplo clique) colide (23505) e é
 * tratado como sucesso. Retorna `{ error }` — nunca lança; o gate só libera o app
 * quando `error === null` (aceite confirmado no banco).
 */
export async function recordTermsAcceptance(
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('terms_acceptance')
    .insert({ user_id: userId, version: TERMS_VERSION });

  if (error) {
    if (error.code === '23505') return { error: null }; // unique_violation → já aceito
    console.error('[termsAcceptance] Falha ao registrar aceite:', error);
    return { error: error.message };
  }
  return { error: null };
}
