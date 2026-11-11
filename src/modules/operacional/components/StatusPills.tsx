import { cn } from '@/utils/cn';
import { statusConfig } from '../statusConfig';

type Props = {
  status?: string | null;
  onChange: (status: string) => void;
  className?: string;
};

// As 4 pills de status de produção (redesign D2), usadas nos cards de Atrasadas/Hoje
// e em Serviços em acompanhamento. Quem usa decide a chamada (updateTask com { status }).
// Celular: grade 2×2 com 44px; md+: uma linha, 32px como antes.
export function StatusPills({ status, onChange, className }: Props) {
  const atual = status || 'pendente';

  return (
    <div className={cn('grid grid-cols-2 gap-1.5 md:flex md:flex-wrap md:gap-1', className)}>
      {Object.keys(statusConfig).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="min-h-[44px] border px-2 text-xs font-medium transition-colors md:min-h-[32px] md:py-0.5"
          style={
            atual === s
              ? { background: statusConfig[s].bg, color: statusConfig[s].color, borderColor: 'transparent', fontWeight: 600 }
              : { background: 'transparent', color: 'var(--text-tertiary)', borderColor: 'var(--border)' }
          }
        >
          {statusConfig[s].label}
        </button>
      ))}
    </div>
  );
}
