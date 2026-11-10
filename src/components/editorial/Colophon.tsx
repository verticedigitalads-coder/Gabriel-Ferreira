interface ColophonProps {
  label: string;
  onBack?: () => void;
}

// Rodapé editorial de módulo com "voltar ao painel" (redesign D0). Só UI:
// quem usa decide o que onBack faz.
export function Colophon({ label, onBack }: ColophonProps) {
  return (
    <footer className="flex flex-wrap items-center gap-3 pt-1 pb-2">
      <span aria-hidden="true" className="h-1.5 w-1.5 bg-[var(--accent)]" />
      <p className="ed-mono text-[var(--text-tertiary)]">{label}</p>
      <span aria-hidden="true" className="h-px flex-1 bg-[var(--border)]" />
      {onBack ? (
        <button
          onClick={onBack}
          className="ed-serif min-h-[44px] px-1 text-[length:var(--text-md)] text-[var(--accent)] transition-opacity hover:opacity-70"
        >
          voltar ao painel
        </button>
      ) : (
        <p className="ed-serif text-[length:var(--text-md)] text-[var(--accent)]">fim do módulo</p>
      )}
    </footer>
  );
}
