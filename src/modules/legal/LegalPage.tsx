import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TERMS_VERSION } from '@/lib/terms';
import { legalContent, type LegalDoc } from './legalContent';

/**
 * Página pública (sem login) que renderiza verbatim o .md legal correspondente.
 * Servida via branch de pathname em main.tsx (/termos e /privacidade), fora do
 * fluxo de auth/store. Estilos escopados em `.legal-*` usando tokens.css (globais
 * via index.css). Mobile-first; tabelas rolam horizontalmente.
 */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { markdown } = legalContent[doc];

  return (
    <div className="legal-root">
      <style>{`
        .legal-root { background: var(--bg-app); color: var(--text-primary); min-height: 100vh; }
        .legal-header { position: sticky; top: 0; z-index: 10; background: rgba(15,17,23,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
        .legal-header-inner { max-width: 820px; margin: 0 auto; padding: 0 20px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
        .legal-logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; color: var(--text-primary); text-decoration: none; }
        .legal-logo-badge { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#ff6a00,#ff8a3d); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 800; }
        .legal-back { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 16px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }
        .legal-back:hover { color: var(--text-primary); border-color: var(--text-tertiary); }
        .legal-main { max-width: 820px; margin: 0 auto; padding: 32px 20px 48px; }
        .legal-prose { font-size: 15px; line-height: 1.7; color: var(--text-secondary); }
        .legal-prose h1 { font-size: 26px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 20px; }
        .legal-prose h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 36px 0 12px; }
        .legal-prose h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 24px 0 8px; }
        .legal-prose p { margin: 0 0 14px; }
        .legal-prose ul, .legal-prose ol { margin: 0 0 14px; padding-left: 22px; }
        .legal-prose li { margin: 0 0 6px; }
        .legal-prose strong { color: var(--text-primary); font-weight: 600; }
        .legal-prose a { color: var(--accent); text-decoration: underline; }
        .legal-prose hr { border: none; border-top: 1px solid var(--border); margin: 28px 0; }
        .legal-prose blockquote { margin: 0 0 14px; padding: 10px 16px; border-left: 3px solid var(--border-accent); background: var(--bg-surface); border-radius: 0 var(--radius-md) var(--radius-md) 0; color: var(--text-tertiary); }
        .legal-prose code { background: var(--bg-surface-2); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
        .legal-table-wrap { overflow-x: auto; margin: 0 0 16px; -webkit-overflow-scrolling: touch; }
        .legal-prose table { border-collapse: collapse; width: 100%; font-size: 14px; }
        .legal-prose th, .legal-prose td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
        .legal-prose th { background: var(--bg-surface-2); color: var(--text-primary); font-weight: 600; white-space: nowrap; }
        .legal-footer { max-width: 820px; margin: 0 auto; padding: 24px 20px 48px; border-top: 1px solid var(--border); color: var(--text-tertiary); font-size: 13px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
      `}</style>

      <header className="legal-header">
        <div className="legal-header-inner">
          <a href="/" className="legal-logo">
            <span className="legal-logo-badge">V</span>
            VRTX <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>CRM</span>
          </a>
          <a href="/" className="legal-back">← Voltar</a>
        </div>
      </header>

      <main className="legal-main">
        <article className="legal-prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Tabelas rolam horizontalmente no mobile sem estourar a página.
              table: ({ node: _node, ...rest }) => (
                <div className="legal-table-wrap">
                  <table {...rest} />
                </div>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </main>

      <footer className="legal-footer">
        <span>Vigente desde {TERMS_VERSION}</span>
        <span>© 2026 VRTX · CRM Inteligente</span>
      </footer>
    </div>
  );
}
