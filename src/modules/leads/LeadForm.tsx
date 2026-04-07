import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Input, TextArea, Select } from '@/components/ui/Input';
import type { Lead, LeadStatus, LeadTemperature } from '@/types';

interface LeadFormProps {
  lead?: Lead | null;
  onClose: () => void;
}

const statusOptions = [
  { value: 'novo', label: 'Novo' },
  { value: 'atendimento', label: 'Em Atendimento' },
  { value: 'orcado', label: 'Orçado' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'perdido', label: 'Perdido' },
];

const temperaturaOptions = [
  { value: 'frio', label: '❄️ Frio' },
  { value: 'morno', label: '☀️ Morno' },
  { value: 'quente', label: '🔥 Quente' },
];

export function LeadForm({ lead, onClose }: LeadFormProps) {
  const addLead = useStore(state => state.addLead)
  const updateLead = useStore(state => state.updateLead)

  const formData = useStore(state => state.leadForm)
  const setLeadForm = useStore(state => state.setLeadForm)
  const resetLeadForm = useStore(state => state.resetLeadForm)
  const addToast = useStore(state => state.addToast)

  useEffect(() => {
    if (lead) {
      setLeadForm({
        nome: lead.nome,
        telefone: lead.telefone,
        email: lead.email,
        endereco: lead.endereco || '',
        servico: lead.servico,
        status: lead.status,
        temperatura: lead.temperatura,
        valorOrcado: lead.valorOrcado,
        orcamentoEnviado: lead.orcamentoEnviado,
        ultimoContato: lead.ultimoContato || '',
        proximoContato: lead.proximoContato || '',
        resumo: lead.resumo,
        observacoes: lead.observacoes,
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lead) {
      await updateLead(lead.id, formData);
      addToast({ type: 'success', message: 'Lead atualizado com sucesso!' });
    } else {
      await addLead(formData);
      addToast({ type: 'success', message: 'Lead adicionado com sucesso!' });
    }

    resetLeadForm()
    onClose()
  };

  const handleChange = (field: string, value: string | number | boolean) => {
  setLeadForm({ [field]: value })
}

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nome *"
          value={formData.nome}
          onChange={e => handleChange('nome', e.target.value)}
          placeholder="Nome do cliente"
          required
        />
	<Input
  	 label="Endereço da Obra"
  	 value={formData.endereco}
  	 onChange={e => handleChange('endereco', e.target.value)}
  	 placeholder="Rua, número, bairro, cidade"
	/>
        <Input
          label="Telefone *"
          value={formData.telefone}
          onChange={e => handleChange('telefone', e.target.value)}
          placeholder="(11) 99999-9999"
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={e => handleChange('email', e.target.value)}
          placeholder="email@exemplo.com"
        />
        <Input
          label="Serviço *"
          value={formData.servico}
          onChange={e => handleChange('servico', e.target.value)}
          placeholder="Tipo de serviço"
          required
        />
        <Select
          label="Status"
          value={formData.status}
          onChange={e => handleChange('status', e.target.value)}
          options={statusOptions}
        />
        <Select
          label="Temperatura"
          value={formData.temperatura}
          onChange={e => handleChange('temperatura', e.target.value)}
          options={temperaturaOptions}
        />
        <Input
          label="Valor Orçado (R$)"
          type="number"
          value={formData.valorOrcado}
          onChange={e => handleChange('valorOrcado', Number(e.target.value))}
          placeholder="0"
        />
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.orcamentoEnviado}
              onChange={e => handleChange('orcamentoEnviado', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Orçamento Enviado</span>
          </label>
        </div>
        <Input
          label="Último Contato"
          type="date"
          value={formData.ultimoContato}
          onChange={e => handleChange('ultimoContato', e.target.value)}
        />
        <Input
          label="Próximo Contato"
          type="date"
          value={formData.proximoContato}
          onChange={e => handleChange('proximoContato', e.target.value)}
        />
      </div>

      <TextArea
        label="Resumo"
        value={formData.resumo}
        onChange={e => handleChange('resumo', e.target.value)}
        placeholder="Resumo do lead e do serviço solicitado"
        rows={2}
      />

      <TextArea
        label="Observações"
        value={formData.observacoes}
        onChange={e => handleChange('observacoes', e.target.value)}
        placeholder="Observações adicionais"
        rows={3}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {lead ? 'Salvar Alterações' : 'Adicionar Lead'}
        </Button>
      </div>
    </form>
  );
}
