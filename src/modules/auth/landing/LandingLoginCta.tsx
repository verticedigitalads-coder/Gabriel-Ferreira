import { ArrowUpRight } from 'lucide-react';
import { CTA_WHATSAPP_LABEL, LEGAL_PATHS, footer, hero, loginCta, whatsappUrl } from './landingContent';
import { abrirContato } from './LandingContato';

// Fechamento + login (visual do Closing da v4.1). À esquerda o título e o CTA do
// WhatsApp; à direita o card #acesso, o login de quem já é cliente. O fluxo do
// login não muda: o mesmo <button onClick={onLogin}> recebe o handleLogin da
// AuthPage e os links legais são os mesmos. O id="acesso" fica no card, visível
// em todas as larguras: é o destino do "Entrar" do nav e um dos alvos que a
// LandingDock observa para não cobrir o botão do Google.
export function LandingLoginCta({ onLogin }: { onLogin: () => void }) {
  return (
    <section id="login" className="lp-v2 lp-fecho">
      <div className="lp-wrap lp-fecho-grid">
        <div className="lp-fecho-texto">
          <h2 className="lp-fecho-titulo lp-reveal">
            {loginCta.title}{' '}<span className="lp-serif">{loginCta.titleDestaque}</span>
          </h2>
          <div className="lp-inter-cta lp-reveal">
            <a href={whatsappUrl('cta-final')} target="_blank" rel="noopener noreferrer" className="lp-cta-big" onClick={abrirContato}>
              {CTA_WHATSAPP_LABEL}
              <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </a>
            <span className="lp-mono">{hero.ctaNota} {footer.whatsappLabel}</span>
          </div>
        </div>
        <div id="acesso" className="lp-acesso lp-reveal">
          <h3 className="lp-acesso-titulo">{loginCta.acessoTitulo}</h3>
          <p className="lp-acesso-texto">{loginCta.acessoTexto}</p>

          <button onClick={onLogin} className="lp-acesso-google">
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.2-.1-2.3-.1-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6.2 5.2C41.8 35.4 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
            {loginCta.googleLabel}
          </button>

          <p className="lp-acesso-legal">
            {loginCta.legalPrefix}{' '}
            <a href={LEGAL_PATHS.termos} target="_blank" rel="noopener noreferrer">{loginCta.termsLabel}</a>{' '}
            {loginCta.legalAnd}{' '}
            <a href={LEGAL_PATHS.privacidade} target="_blank" rel="noopener noreferrer">{loginCta.privacyLabel}</a>.
          </p>

          <ul className="lp-acesso-trust">
            {loginCta.trust.map(item => (
              <li key={item} className="lp-mono">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
