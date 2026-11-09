import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CTA_WHATSAPP_LABEL, dock, footer, whatsappUrl } from './landingContent';
import { abrirContato } from './LandingContato';

// Barra fixa do celular (o CSS esconde a partir de 1024px). Aparece quando o hero
// sai da tela e some quando o card de login (#acesso) ou o rodapé entram, para não
// cobrir o "Entrar com Google" nem os links legais. Se faltar um dos três, fica
// escondida.
export function LandingDock() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('.lp-hero');
    const acesso = document.getElementById('acesso');
    const rodape = document.querySelector('footer');
    if (!hero || !acesso || !rodape) return;
    const alvos = [hero, acesso, rodape];

    const naTela = new Map<Element, boolean>();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => naTela.set(e.target, e.isIntersecting));
      // Só decide depois que os três reportaram, para não piscar no carregamento.
      if (naTela.size === alvos.length) setVisivel(![...naTela.values()].some(Boolean));
    });
    alvos.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className={`lp-dock lp-v2${visivel ? ' is-on' : ''}`}>
      <div className="lp-dock-info">
        <span className="lp-mono">{dock.kicker}</span>
        <span className="lp-dock-num">{footer.whatsappLabel}</span>
      </div>
      <a href={whatsappUrl('dock')} target="_blank" rel="noopener noreferrer" className="lp-cta lp-dock-cta" onClick={abrirContato}>
        <span>{CTA_WHATSAPP_LABEL}</span>
        <span className="lp-cta-seta" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.75} /></span>
      </a>
    </div>
  );
}
