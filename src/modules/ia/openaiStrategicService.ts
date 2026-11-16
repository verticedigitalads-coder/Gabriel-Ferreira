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
Você escreve os textos da análise a partir dos dados e do histórico do lead abaixo e revisa os números com cautela.

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
Resumo do lead: ${lead.resumo || 'Sem resumo.'}

===== HISTÓRICO RECENTE =====
${historicoRecente}

===== ANÁLISE BASE DO SISTEMA =====
Risco Atual: ${baseAnalysis.riscoDePerda}
Urgência (1-5): ${baseAnalysis.nivelDeUrgencia}
Probabilidade de conversão: ${baseAnalysis.probabilidadeConversao}
Maturidade (1-5): ${baseAnalysis.maturidade}
Risco de concorrência: ${baseAnalysis.riscoConcorrencia}
Potencial futuro: ${baseAnalysis.potencialFuturo}

===== INSTRUÇÕES =====
1. Escreva SEMPRE resumoExecutivo, estrategiaDeAbordagem e mensagemSugeridaWhatsApp a partir dos dados e do histórico acima, com 2 a 3 frases cada, específicos para este lead (serviço, valor, ponto da negociação, tempo sem contato).
2. mensagemSugeridaWhatsApp: pronta para enviar, em tom de WhatsApp, chamando o cliente pelo primeiro nome, citando o serviço e o próximo passo.
3. Nunca invente preço, data, prazo ou fato que não esteja nos dados acima.
4. Os números (riscoDePerda, probabilidadeConversao, maturidade, riscoConcorrencia, potencialFuturo) são conservadores: inclua um só se os dados justificarem mudar o valor base; senão, omita a chave.

Responda SOMENTE em JSON válido, usando EXATAMENTE estas chaves (os 3 textos sempre; os números só quando mudar):

{
  "resumoExecutivo": "2 a 3 frases sobre a situação do lead",
  "estrategiaDeAbordagem": "2 a 3 frases com o que fazer agora",
  "mensagemSugeridaWhatsApp": "mensagem pronta para enviar ao cliente",
  "riscoDePerda": "baixo | medio | alto | critico",
  "probabilidadeConversao": 0,
  "maturidade": 0,
  "riscoConcorrencia": "baixo | medio | alto",
  "potencialFuturo": "baixo | medio | alto"
}
`;

  const response = await apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Você escreve análises comerciais curtas e objetivas, sem inventar fatos, e retorna apenas JSON válido.',
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
