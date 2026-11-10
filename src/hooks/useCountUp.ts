import { useEffect, useRef, useState } from 'react';

const DURACAO_MS = 1200;

function semAnimacao() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Número que sobe até `alvo` (redesign D1). Ao abrir, sai de 0; se o alvo mudar
// depois (realtime), anima do valor mostrado até o novo. Com "reduzir movimento"
// ligado no aparelho, devolve o valor final direto.
export function useCountUp(alvo: number): number {
  const [valor, setValor] = useState(() => (semAnimacao() ? alvo : 0));
  const atual = useRef(valor);

  useEffect(() => {
    if (semAnimacao()) {
      atual.current = alvo;
      setValor(alvo);
      return;
    }

    const inicio = atual.current;
    const t0 = performance.now();
    let frame = 0;

    const passo = (agora: number) => {
      const t = Math.min((agora - t0) / DURACAO_MS, 1);
      const suave = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
      const proximo = inicio + (alvo - inicio) * suave;
      atual.current = proximo;
      setValor(proximo);
      if (t < 1) frame = requestAnimationFrame(passo);
    };

    frame = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frame);
  }, [alvo]);

  return valor;
}
