/**
 * Versão vigente dos documentos legais (Termos de Uso + Política de Privacidade).
 *
 * É a MESMA string usada em três lugares — mantenha-os sincronizados:
 *  - cabeçalho dos .md em docs/legal/ ("Última atualização")
 *  - rodapé das páginas públicas /termos e /privacidade ("Vigente desde ...")
 *  - coluna `version` gravada em `terms_acceptance` e comparada pelo gate de aceite.
 *
 * Ao publicar uma nova revisão dos documentos, bumpe esta data (formato AAAA-MM-DD):
 * todos os usuários passarão a ver o gate de aceite uma vez.
 *
 * NOTA: definida como a data de finalização; ajuste para a data real do deploy se
 * publicar em outro dia (o valor precisa apenas ser consistente entre os 3 pontos).
 */
export const TERMS_VERSION = '2026-07-15';
