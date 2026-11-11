import { SectionHeading } from '@/components/editorial/SectionHeading';
import { cn } from '@/utils/cn';
import { statusConfig } from '../statusConfig';

// Nota curta de cada etapa (redesign D2)
const NOTAS: Record<string, string> = {
  pendente: 'a começar',
  em_producao: 'em execução',
  pronto: 'aguardando instalação',
  instalado: 'falta concluir',
};

type Props = {
  index: string;
  servicos: any[];
  etapa: string | null;
  onEtapa: (etapa: string) => void;
};

// 01 Linha de produção (redesign D2): contagem dos serviços abertos por status.
// Só UI: a lista e o filtro chegam por props. Sem status conta como Pendente,
// o mesmo critério das pills. No celular, só número + rótulo; número da etapa,
// nota e barra a partir de md. 2×2 até 1024px (a 768 as notas não cabem em 4 colunas).
export function LinhaProducao({ index, servicos, etapa, onEtapa }: Props) {
  return (
    <section className="border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 pt-5 pb-6 md:px-6">
      <SectionHeading index={index} label="Linha de produção" />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Object.keys(statusConfig).map((s, i) => {
          const ativa = etapa === s;
          const n = servicos.filter((t) => (t.status || 'pendente') === s).length;
          return (
            <button
              key={s}
              onClick={() => onEtapa(s)}
              aria-pressed={ativa}
              className={cn(
                'flex min-h-[44px] flex-col items-start border px-3 py-2.5 text-left transition-colors motion-reduce:transition-none md:py-3',
                ativa ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'
              )}
            >
              <span
                className={cn(
                  'ed-mono hidden h-6 w-6 items-center justify-center border md:flex',
                  ativa ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-app)]' : 'border-[var(--border-accent)] text-[var(--accent)]'
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={cn('tnum text-[34px] leading-none md:mt-3', n > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]')}
                style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.04em' }}
              >
                {String(n).padStart(2, '0')}
              </span>
              <span className={cn('ed-mono mt-2', ativa ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]')}>
                {statusConfig[s].label}
              </span>
              <span className="ed-mono mt-1 hidden text-[var(--text-tertiary)] md:block">{NOTAS[s]}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'mt-3 hidden h-[2px] transition-all duration-500 motion-reduce:transition-none md:block',
                  ativa ? 'w-full bg-[var(--accent)]' : 'w-8 bg-[var(--border-strong)]'
                )}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
