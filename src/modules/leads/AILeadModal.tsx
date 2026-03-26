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
import { Lead } from '../../types';
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
        data: dataVisita,
        tipo: 'visita',
        prioridade: 'media',
        leadId: createdLead.id,
      });
    }

    addToast({
      type: 'success',
      message: 'Lead criado com sucesso via IA!',
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
          tipo: 'ia',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-slate-200">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                Criar Lead com IA
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Extraia dados de conversas do WhatsApp automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!analysis ? (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                Cole a conversa aqui:
              </label>
              <textarea
                value={conversation}
                onChange={(e) => setConversation(e.target.value)}
                placeholder="Ex: [10:30] Cliente: Olá, gostaria de um orçamento para drywall na minha sala. Meu nome é João e meu tel é 11999887766..."
                className="w-full h-64 p-4 text-sm border-2 border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 resize-none font-mono bg-slate-50"
              />
              <div className="flex items-center gap-2 text-slate-500 text-sm italic">
                <Clipboard className="w-4 h-4" />
                <span>
                  Dica: Copie toda a conversa do WhatsApp e cole aqui.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {duplicateLead && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-800">
                      Lead Existente Detectado
                    </h4>
                    <p className="text-sm text-amber-700">
                      Identificamos que <strong>{duplicateLead.nome}</strong> já
                      está cadastrado.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Nome
                  </label>
                  <input
                    value={analysis.nome || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, nome: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Telefone
                  </label>
                  <input
                    value={analysis.telefone || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, telefone: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Email
                  </label>
                  <input
                    value={analysis.email || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, email: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Endereço da Obra
                  </label>
                  <input
                    value={analysis.endereco || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, endereco: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Serviço
                  </label>
                  <input
                    value={analysis.servico || ''}
                    onChange={(e) =>
                      setAnalysis({ ...analysis, servico: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Status
                  </label>
                  <select
                    value={analysis.status || ''}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  >
                    <option value="novo">Novo</option>
                    <option value="atendimento">Atendimento</option>
                    <option value="orcado">Orçado</option>
                    <option value="fechado">Fechado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Temperatura
                  </label>
                  <select
                    value={analysis.temperatura || ''}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        temperatura: e.target.value as any,
                      })
                    }
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  >
                    <option value="frio">Frio</option>
                    <option value="morno">Morno</option>
                    <option value="quente">Quente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Valor Orçado
                  </label>
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
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Último Contato
                  </label>
                  <input
                    type="date"
                    value={analysis.ultimoContato?.split('T')[0] || ''}
                    readOnly
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Próximo Contato
                  </label>
                  <input
                    type="date"
                    value={analysis.dataSugeridaFollowUp || ''}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        dataSugeridaFollowUp: e.target.value,
                      })
                    }
                    className="w-full p-2 text-sm border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Resumo Gerado
                </label>

                <textarea
                  value={analysis.resumo || ''}
                  onChange={(e) =>
                    setAnalysis({ ...analysis, resumo: e.target.value })
                  }
                  className="w-full p-3 text-sm border border-slate-200 rounded bg-white h-24 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Temperatura
                  </span>

                  <span className="text-sm font-bold uppercase text-slate-700">
                    {analysis.temperatura}
                  </span>
                </div>

                <div className="flex-1 p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Próxima Ação
                  </span>

                  <span className="text-sm font-medium text-slate-700 italic">
                    "{analysis.proximaAcao}"
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
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
