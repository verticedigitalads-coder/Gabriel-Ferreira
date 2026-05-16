import type { Lead } from '@/types';

interface OpenAIStrategicResponse {
  ajusteMensagem?: string;
  ajusteEstrategia?: string;
  observacaoExtra?: string;
  riscoReavaliado?: 'baixo' | 'medio' | 'alto' | 'critico';
}

function calcularDiasSemContato(lead: Lead): number {
  if (!lead.ultimoContato) return 999;
  const diff = Date.now() - new Date(lead.ultimoContato).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatarHistoricoRecente(lead: Lead): string {
  if (!lead.historico || lead.historico.length === 0) {
    return 'Sem histórico registrado.';
  }

  return lead.historico
    .slice(-5)
    .map((h) => {
      return `- ${h.tipo.toUpperCase()} | ${h.descricao} | ${h.createdAt}`;
    })
    .join('\n');
}

export async function refineLeadStrategyWithAI(
  lead: Lead,
  baseAnalysis: any,
): Promise<OpenAIStrategicResponse | null> {
  const diasSemContato = calcularDiasSemContato(lead);
  const historicoRecente = formatarHistoricoRecente(lead);

  const prompt = `
Você é um especialista em vendas B2B para serviços locais (serralheria, marcenaria, drywall, reformas).
Você NÃO pode inventar dados.
Você deve apenas refinar estrategicamente a análise existente.

===== DADOS DO LEAD =====
Nome: ${lead.nome}
Serviço: ${lead.servico}
Status Atual: ${lead.status}
Temperatura Atual: ${lead.temperatura}
Valor Orçado: ${lead.valorOrcado}
Prioridade Score: ${lead.prioridadeScore}
Prioridade Level: ${lead.prioridadeLevel}
Origem: ${lead.origem}
Prazo do Cliente: ${lead.prazoCliente}
Probabilidade Manual: ${lead.probabilidadeManual}
Dias sem contato: ${diasSemContato}

===== HISTÓRICO RECENTE =====
${historicoRecente}

===== ANÁLISE BASE DO SISTEMA =====
Risco Atual: ${baseAnalysis.riscoDePerda}
Urgência (1-5): ${baseAnalysis.nivelDeUrgencia}
Resumo Executivo: ${baseAnalysis.resumoExecutivo}
Estratégia Base: ${baseAnalysis.estrategiaDeAbordagem}
Mensagem Base: ${baseAnalysis.mensagemSugeridaWhatsApp}

===== INSTRUÇÕES =====
1. Ajuste apenas se realmente houver inconsistência estratégica.
2. Não altere status sem justificativa clara.
3. Seja conservador.
4. Nunca invente fatos.
5. Não reescreva tudo se estiver adequado.

Responda SOMENTE em JSON válido:

{
  "ajusteMensagem": "mensagem melhorada mantendo contexto",
  "ajusteEstrategia": "estratégia melhorada se necessário",
  "observacaoExtra": "insight estratégico adicional opcional",
  "riscoReavaliado": "baixo | medio | alto | critico"
}

Se tudo estiver adequado, retorne {}.
`;

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Seja objetivo, conservador e retorne apenas JSON válido.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    return null;
  }

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return null;
  }
}
