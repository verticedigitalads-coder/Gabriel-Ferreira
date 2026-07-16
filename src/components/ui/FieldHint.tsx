import { ReactNode } from 'react';

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-[var(--text-tertiary)] mt-1">{children}</p>;
}
