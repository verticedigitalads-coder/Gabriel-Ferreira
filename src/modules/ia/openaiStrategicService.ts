import type { Lead } from '@/types';
import { apiFetch } from '@/lib/apiFetch';
import type { StrategicDiagnosis } from './strategicDiagnosisService';

// A IA responde só com os campos reais de StrategicDiagnosis que decidir ajustar
// — usar as mesmas chaves evita qualquer camada de tradução/mapeamento no merge.
export type OpenAIStrategicResponse = Partial<
  Pick<
    StrategicDiagnosis,
    | 'resumoExecutivo'
    | 'estrategiaDeAbordagem'
    | 'mensagemSugeridaWhatsApp'
    | 'riscoDePerda'
    | 'probabilidadeConversao'
    | 'maturidade'
    | 'riscoConcorrencia'
    | 'potencialFuturo'
  >
>;

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
  baseAnalysis: StrategicDiagnosis,
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

Responda SOMENTE em JSON válido, usando EXATAMENTE estas chaves — inclua
apenas as que você decidir ajustar (omita as demais, não repita o valor base):

{
  "resumoExecutivo": "resumo executivo revisado, se necessário",
  "estrategiaDeAbordagem": "estratégia revisada, se necessário",
  "mensagemSugeridaWhatsApp": "mensagem melhorada mantendo contexto",
  "riscoDePerda": "baixo | medio | alto | critico",
  "probabilidadeConversao": 0,
  "maturidade": 0,
  "riscoConcorrencia": "baixo | medio | alto",
  "potencialFuturo": "baixo | medio | alto"
}

Se tudo estiver adequado, retorne {}.
`;

  const response = await apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
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

  if (!response.ok) {
    console.error('[IA Estratégica] OpenAI respondeu com erro HTTP', response.status);
    return null;
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    console.error('[IA Estratégica] Resposta OpenAI sem conteúdo utilizável', data);
    return null;
  }

  try {
    return JSON.parse(data.choices[0].message.content) as OpenAIStrategicResponse;
  } catch (err) {
    console.error(
      '[IA Estratégica] Falha ao parsear JSON da IA',
      err,
      data.choices[0].message.content,
    );
    return null;
  }
}
