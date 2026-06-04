import { Clock, DollarSign, FileText, TrendingDown } from 'lucide-react';

export type HealthReason = {
  icon: 'leads' | 'financeiro' | 'orcamentos' | 'meta';
  label: string;
  severity: 'warn' | 'crit';
  actionLabel: string;
  onAction: () => void;
};

const ICON_MAP = {
  leads: Clock,
  financeiro: DollarSign,
  orcamentos: FileText,
  meta: TrendingDown,
};

export function CrmHealthReasons({ reasons }: { reasons: HealthReason[] }) {
  if (reasons.length === 0) return null;

  return (
    <div
      className="mt-1 rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      {reasons.map((r, i) => {
        const Icon = ICON_MAP[r.icon];
        const color = r.severity === 'crit' ? 'var(--danger)' : 'var(--warning)';
        const subtleColor = r.severity === 'crit' ? 'var(--danger-subtle)' : 'var(--warning-subtle)';

        return (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              borderTop: i > 0 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div
              className="flex items-center justify-center rounded-md shrink-0"
              style={{ width: 28, height: 28, background: subtleColor }}
            >
              <Icon style={{ width: 14, height: 14, color }} />
            </div>

            <span
              className="flex-1 text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              {r.label}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                r.onAction();
              }}
              className="text-xs font-semibold shrink-0 px-3 py-1 rounded-md transition-colors"
              style={{
                color: 'var(--accent)',
                background: 'var(--accent-subtle)',
                minHeight: 28,
              }}
            >
              {r.actionLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}
