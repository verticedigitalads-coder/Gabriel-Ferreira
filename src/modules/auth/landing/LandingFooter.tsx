import { LEGAL_PATHS, footer, nav, whatsappUrl } from './landingContent';

// Rodapé (visual do Footer da v4.1), seção clara (.lp-claro). Precisa continuar
// sendo o único <footer> da página: a LandingDock usa document.querySelector('footer')
// para sumir aqui. Os links de navegação são os do nav (nav.links). O wordmark é
// aria-hidden (repete a marca) e fica em fluxo inline, com espaço real entre as
// palavras, para o texto da página ser "VRTX CRM" e não "VRTXCRM".
export function LandingFooter() {
  return (
    <footer className="lp-v2 lp-claro lp-rodape">
      <div className="lp-wrap">
        <div className="lp-rodape-topo">
          <div className="lp-rodape-contato">
            <span>{footer.local}</span>
            {/* CNPJ: entra aqui, numa linha abaixo de footer.local, quando existir. */}
            <a href={whatsappUrl('rodape')} target="_blank" rel="noopener noreferrer" className="lp-rodape-link">WhatsApp {footer.whatsappLabel}</a>
          </div>
          <nav className="lp-rodape-nav" aria-label="Rodapé">
            {nav.links.map(link => (
              <a key={link.href} href={link.href} className="lp-rodape-link">{link.label}</a>
            ))}
          </nav>
        </div>
        <p className="lp-rodape-marca" aria-hidden="true">
          {nav.brand}{' '}<span className="lp-rodape-marca-sufixo">{nav.brandSuffix}</span>
        </p>
        <div className="lp-rodape-base">
          <span className="lp-mono">{footer.copyright}</span>
          <div className="lp-rodape-legal">
            <a href={LEGAL_PATHS.privacidade} className="lp-rodape-link">{footer.privacidadeLabel}</a>
            <a href={LEGAL_PATHS.termos} className="lp-rodape-link">{footer.termosLabel}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
