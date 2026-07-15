// Fonte única de verdade: os .md revisados em docs/legal/ são importados como texto
// bruto (?raw) e renderizados verbatim nas páginas públicas /termos e /privacidade.
//
// ATENÇÃO (isolamento de bundle): APENAS 01 e 02 são importados aqui. Os documentos
// 03-DPA e 04-parecer NÃO devem ser importados em lugar nenhum — assim o Vite nunca
// os inclui em nenhum chunk.
import politica from '../../../docs/legal/01-politica-de-privacidade.md?raw';
import termos from '../../../docs/legal/02-termos-de-uso.md?raw';

export type LegalDoc = 'privacidade' | 'termos';

export const legalContent: Record<LegalDoc, { title: string; markdown: string }> = {
  privacidade: { title: 'Política de Privacidade', markdown: politica },
  termos: { title: 'Termos de Uso', markdown: termos },
};
