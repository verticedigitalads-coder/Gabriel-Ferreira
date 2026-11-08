// Rótulos e cores do status de produção da tarefa operacional. Fora dos
// componentes de propósito: exportar constante de arquivo de componente quebra
// o Fast Refresh do Vite. Usado por Operacional.tsx e OperacionalCalendar.tsx.
export const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente:    { label: 'Pendente',    color: 'var(--text-secondary)', bg: 'var(--bg-surface-3)' },
  em_producao: { label: 'Em produção', color: 'var(--info)',           bg: 'var(--info-subtle)' },
  pronto:      { label: 'Pronto',      color: 'var(--success)',        bg: 'var(--success-subtle)' },
  instalado:   { label: 'Instalado',   color: 'var(--ia)',             bg: 'var(--ia-subtle)' },
};
