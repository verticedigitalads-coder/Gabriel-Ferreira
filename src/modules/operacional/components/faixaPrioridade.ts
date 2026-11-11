// Cor da faixa e rótulo da prioridade da tarefa operacional (redesign D2).
// Fora dos componentes de propósito: exportar constante de arquivo de componente
// quebra o Fast Refresh do Vite (mesmo motivo do statusConfig.ts).
export const FAIXA_PRIORIDADE: Record<string, string> = {
  alta: 'var(--danger)',
  media: 'var(--warning)',
  baixa: 'var(--info)',
};

export const ROTULO_PRIORIDADE: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};
