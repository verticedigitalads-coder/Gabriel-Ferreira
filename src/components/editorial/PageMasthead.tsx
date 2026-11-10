import type { ReactNode } from 'react';

interface PageMastheadProps {
  kicker: string;
  title: string;
  italic: string;
  description?: string;
  ghost: string;
  stat: ReactNode;
  statLabel: string;
  tone?: 'accent' | 'ia';
}

// Cabeçalho editorial de módulo (redesign D0). Só UI: tudo chega por props.
// Os tamanhos de display (título, número e letra-fantasma) não têm token e ficam
// literais. O `!` vence a regra global de h2 do index.css, que fica fora de layer.
export function PageMasthead({
  kicker,
  title,
  italic,
  description,
  ghost,
  stat,
  statLabel,
  tone = 'accent',
}: PageMastheadProps) {
  const cor = tone === 'ia' ? 'var(--ia)' : 'var(--accent)';

  return (
    <section className="relative overflow-hidden border border-[var(--border-strong)] bg-[var(--bg-surface)]">
      <span
        aria-hidden="true"
        className="ed-serif ed-ghost pointer-events-none select-none absolute -right-6 -top-16 leading-none text-[200px] md:text-[220px]"
      >
        {ghost}
      </span>
      <span aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] w-32" style={{ background: cor }} />

      <div className="relative flex flex-wrap items-end justify-between gap-6 md:gap-8 px-5 pt-5 pb-6 md:px-7 md:pt-6 md:pb-7">
        <div className="min-w-0 max-w-2xl">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0" style={{ background: cor }} />
            <p className="ed-mono text-[var(--text-tertiary)]">{kicker}</p>
          </div>
          <h2
            className="mt-4 text-[32px]! md:text-[52px]! leading-[0.94] break-words"
            style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.045em', color: 'var(--text-primary)' }}
          >
            <span>{title}</span>{' '}
            <span className="ed-serif" style={{ color: cor }}>{italic}</span>
          </h2>
          {description && (
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
          )}
        </div>

        <div className="border-l-2 pl-4" style={{ borderColor: cor }}>
          <p
            className="tnum leading-[0.8] text-[56px] md:text-[72px] text-[var(--text-primary)]"
            style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.06em' }}
          >
            {stat}
          </p>
          <p className="ed-mono mt-2 text-[var(--text-tertiary)]">{statLabel}</p>
        </div>
      </div>
    </section>
  );
}
