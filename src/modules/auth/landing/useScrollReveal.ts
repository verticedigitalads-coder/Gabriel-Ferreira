import { useEffect } from 'react';

// Revela os blocos `.lp-reveal` conforme entram na viewport, mexendo direto no
// style inline (a landing não usa o design system interno). Precisa ser chamado
// pelo componente PAI: o efeito do pai roda depois da montagem dos filhos, então
// o querySelectorAll já encontra todas as seções.
export function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'none';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.lp-reveal').forEach(el => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(20px)';
      (el as HTMLElement).style.transition = 'opacity .6s ease, transform .6s ease';
      obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);
}
