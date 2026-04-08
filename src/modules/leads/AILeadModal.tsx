import { AIAnalysisResult } from '@/services/ai/ai.service';
import React, { useState } from 'react';
import {
  Bot,
  X,
  Clipboard,
  Check,
  AlertTriangle,
  UserPlus,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { AIService } from '@/services/ai/ai.service';
import { HISTORICO_TIPO, Lead } from '../../types';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface AILeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AILeadModal: React.FC<AILeadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [conversation, setConversation] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const {
    leads,
    workspaceId,
    addLead,
    updateLead,
    addToast,
    addOperacionalTask,
  } = useStore();

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!conversation.trim()) {
      addToast({
        type: 'warning',
        message: 'Cole uma conversa para analisar.',
      });
      return;
    }

    // 🔥 PROTEÇÃO IMPORTANTE
    if (!workspaceId) {
      console.warn('workspaceId não definido');

      addToast({
        type: 'error',
        message: 'Workspace não encontrado. Recarregue a página.',
      });

      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await AIService.analyzeConversation(conversation);
      setAnalysis(result);

      // Check for duplicity
      const leadData = AIService.convertToLead(result, workspaceId);
      const duplicate = AIService.checkDuplicity(leadData, leads);
      setDuplicateLead(duplicate);
    } catch (error) {
      console.error('ERRO NA ANALISE DA IA:', error);

      addToast({
        type: 'error',
        message: 'Erro ao analisar conversa. Veja o console (F12).',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateNew = async () => {
    console.log('ANALYSIS RESULT:', analysis);

    if (!analysis) return;

    const rawLead = AIService.convertToLead(
      analysis,
      workspaceId || '',
    ) as Lead;

    const {
      id,
      workspaceId: wId,
      prioridadeScore,
      prioridadeLevel,
      historico,
      createdAt,
      updatedAt,
      ...leadData
    } = rawLead;

    // 🔥 SANITIZAÇÃO CRÍTICA
    const safeLeadData = {
      ...leadData,
      nome: leadData.nome || 'Lead sem nome',
      telefone: leadData.telefone || '',
      endereco: leadData.endereco || '',
      valorOrcado: leadData.valorOrcado ?? 0,
    };

    const createdLead = await addLead(safeLeadData);

    if (!createdLead) {
      console.error('Lead não foi criado');
      return;
    }

    const visitaSugerida = Boolean(analysis.visitaSugerida);

    if (visitaSugerida) {
      const dataVisita =
        analysis.dataVisitaSugerida || new Date().toISOString().split('T')[0];

      await addOperacionalTask({
        titulo: `Visita orçamento - ${analysis.nome || 'Cliente'}`,
        descricao: analysis.endereco ? `Endereço: ${analysis.endereco}` : 'Endereço não identificado',
        data: dataVisita,
        tipo: 'visita',
        prioridade: 'media',
        leadId: createdLead.id,
      });
    }

    addToast({
      type: 'success',
      message: visitaSugerida ? 'Lead criado! Tarefa de visita agendada no Operacional.' : 'Lead criado! Nenhuma visita detectada na conversa.',
    });

    onClose();
    resetState();
  };

  const handleUpdateExisting = () => {
    if (!analysis || !duplicateLead) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      id,
      workspaceId: wId,
      historico: newHist,
      createdAt,
      updatedAt,
      ...leadData
    } = AIService.convertToLead(analysis, workspaceId || '') as Lead;

    updateLead(duplicateLead.id, {
      ...leadData,
      historico: [
        ...duplicateLead.historico,
        {
          id: crypto.randomUUID(),
          data: new Date().toISOString(),
          tipo: HISTORICO_TIPO.IA_ANALYSIS,
          descricao: 'Dados atualizados via análise de nova conversa por IA.',
        },
      ],
    });

    addToast({
      type: 'success',
      message: 'Lead existente atualizado com sucesso!',
    });
    onClose();
    resetState();
  };

  const resetState = () => {
    setConversation('');
    setAnalysis(null);
    setDuplicateLead(null);
  };

  const inputClass = "w-full p-2 text-sm border border-[var(--border)] rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";
  const labelClass = "text-[10px] font-bold text-[var(--text-tertiary)] uppercase";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-[var(--border)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--accent)] rounded-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
                Criar Lead com IA
              </h2>
              <p className="text-xs text-[var(--text-tertiary)] font-medium">
                Extraia dados de conversas do WhatsApp automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--bg-surface)]">
          {!analysis ? (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Cole a conversa aqui:
              </label>
              <textarea
                value={conversation}
                onChange={(e) => setConversation(e.target.value)}
                placeholder="Ex: [10:30] Cliente: Olá, gostaria de um orçamento para drywall na minha sala. Meu nome é João e meu tel é 11999887766..."
                className="w-full h-64 p-4 text-sm border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] focus:outline-none resize-none font-mono bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              />
              <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-sm italic">
                <Clipboard className="w-4 h-4" />
                <span>
                  Dica: Copie toda a conversa do WhatsApp e cole aqui.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {duplicateLead && (
                <div className="p-4 bg-[var(--warning-subtle)] border border-[var(--warning)] rounded-md flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--warning)]">
                      Lead Existente Detectado
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Identificamos que <strong>{duplicateLead.nome}</strong> já
                      está cadastrado.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Nome</label>
                  <input
                    value={analysis.nome || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, nome: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Telefone</label>
                  <input
                    value={analysis.telefone || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, telefone: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Email</label>
                  <input
                    value={analysis.email || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, email: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Endereço da Obra</label>
                  <input
                    value={analysis.endereco || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, endereco: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Serviço</label>
                  <input
                    value={analysis.servico || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, servico: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Status</label>
                  <select
                    value={analysis.status || ''}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        status: e.target.value as any,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="novo">Novo</option>
                    <option value="atendimento">Atendimento</option>
                    <option value="orcado">Orçado</option>
                    <option value="fechado">Fechado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Temperatura</label>
                  <select
                    value={analysis.temperatura || ''}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        temperatura: e.target.value as any,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="frio">Frio</option>
                    <option value="morno">Morno</option>
                    <option value="quente">Quente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Valor Orçado</label>
                  <input
                    type="number"
                    value={analysis.valorOrcado || ''}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        valorOrcado: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Último Contato</label>
                  <input
                    type="date"
                    value={analysis.ultimoContato?.split('T')[0] || ''}
                    readOnly
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Próximo Contato</label>
                  <input
                    type="date"
                    value={analysis.dataSugeridaFollowUp || ''}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        dataSugeridaFollowUp: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`${labelClass} tracking-wider`}>
                  Resumo Gerado
                </label>

                <textarea
                  value={analysis.resumo || ''}
                  onChange={(e) =>
                    setAnalysis({ ...analysis, resumo: e.target.value })
                  }
                  className="w-full p-3 text-sm border border-[var(--border)] rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)] h-24 resize-none font-medium leading-relaxed focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 p-3 bg-[var(--bg-surface-2)] rounded border border-[var(--border)]">
                  <span className={`${labelClass} block mb-1`}>
                    Temperatura
                  </span>

                  <span className="text-sm font-bold uppercase text-[var(--text-primary)]">
                    {analysis.temperatura}
                  </span>
                </div>

                <div className="flex-1 p-3 bg-[var(--bg-surface-2)] rounded border border-[var(--border)]">
                  <span className={`${labelClass} block mb-1`}>
                    Próxima Ação
                  </span>

                  <span className="text-sm font-medium text-[var(--text-secondary)] italic">
                    "{analysis.proximaAcao}"
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)] flex justify-end gap-3">
          {!analysis ? (
            <>
              <Button variant="ghost" onClick={onClose} disabled={isAnalyzing}>
                Cancelar
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !conversation.trim()}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                Analisar Conversa
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setAnalysis(null)}>
                Recomeçar
              </Button>
              {duplicateLead ? (
                <Button
                  variant="secondary"
                  onClick={handleUpdateExisting}
                  className="gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Atualizar Existente
                </Button>
              ) : (
                <Button onClick={handleCreateNew} className="gap-2">
                  <Check className="w-4 h-4" />
                  Criar Novo Lead
                </Button>
              )}
              {duplicateLead && (
                <Button
                  variant="ghost"
                  onClick={handleCreateNew}
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Criar mesmo assim
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
