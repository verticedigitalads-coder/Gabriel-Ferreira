interface EmptyStateProps {
  title: string;
  note: string;
}

// Estado vazio editorial (redesign D0). Só UI.
export function EmptyState({ title, note }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-[var(--border-strong)] px-5 py-10 text-center">
      <p className="ed-serif text-[22px] text-[var(--text-secondary)]">{title}</p>
      <p className="ed-mono mt-1 text-[var(--text-tertiary)]">{note}</p>
    </div>
  );
}
