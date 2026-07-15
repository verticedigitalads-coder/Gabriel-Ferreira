import { LegalPage } from './LegalPage';

/**
 * Roteador mínimo das páginas públicas. Lê o pathname (o app não tem router) e
 * escolhe o documento. Carregado de forma lazy por main.tsx apenas quando o
 * pathname é /termos ou /privacidade — assim react-markdown/remark-gfm ficam num
 * chunk separado, fora do bundle principal do app.
 */
export default function PublicLegalRouter() {
  const doc = window.location.pathname === '/termos' ? 'termos' : 'privacidade';
  return <LegalPage doc={doc} />;
}
