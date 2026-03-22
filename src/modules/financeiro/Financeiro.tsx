import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Users,
  Percent,
} from 'lucide-react';
import type { TransactionType } from '@/types';

const tipoOptions = [
  { value: 'receita', label: '↑ Receita' },
  { value: 'despesa', label: '↓ Despesa' },
  { value: 'comissao', label: '% Comissão' },
  { value: 'pagamento_funcionario', label: '👤 Pagamento Funcionário' },
];

const categoriaOptions = [
  { value: 'Serviços', label: 'Serviços' },
  { value: 'Material', label: 'Material' },
  { value: 'Mão de obra', label: 'Mão de obra' },
  { value: 'Aluguel', label: 'Aluguel' },
  { value: 'Transporte', label: 'Transporte' },
  { value: 'Alimentação', label: 'Alimentação' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Outros', label: 'Outros' },
];

export function Financeiro() {
  const transactions = useStore((state) => state.transactions);
  const leads = useStore((state) => state.leads);
  const deleteTransaction = useStore((state) => state.deleteTransaction);

  const [showModal, setShowModal] = useState(false);

  // 🔥 NOVO
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(new Date(), 'yyyy-MM'),
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(monthStart);

  const monthTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const date = parseISO(t.data);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transactions, monthStart, monthEnd]);

  const stats = useMemo(() => {
    let receitas = 0;
    let despesas = 0;
    let comissoes = 0;
    let pagamentos = 0;

    monthTransactions.forEach((t) => {
      switch (t.tipo) {
        case 'receita':
          receitas += t.valor;
          break;
        case 'despesa':
          despesas += t.valor;
          break;
        case 'comissao':
          comissoes += t.valor;
          break;
        case 'pagamento_funcionario':
          pagamentos += t.valor;
          break;
      }
    });

    const totalSaidas = despesas + comissoes + pagamentos;
    const resultado = receitas - totalSaidas;

    return {
      receitas,
      despesas,
      comissoes,
      pagamentos,
      totalSaidas,
      resultado,
    };
  }, [monthTransactions]);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction(id);
    }
  };

  const getLeadName = (leadId?: string) => {
    if (!leadId) return null;
    const lead = leads.find((l) => l.id === leadId);
    return lead?.nome;
  };

  const getTypeIcon = (tipo: TransactionType) => {
    switch (tipo) {
      case 'receita':
        return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case 'despesa':
        return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
      case 'comissao':
        return <Percent className="w-5 h-5 text-orange-500" />;
      case 'pagamento_funcionario':
        return <Users className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-sm text-gray-500">
              Controle de receitas e despesas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Transação
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Receitas"
            value={formatCurrency(stats.receitas)}
            color="green"
            icon={<TrendingUp />}
          />
          <StatCard
            label="Despesas"
            value={formatCurrency(stats.despesas)}
            color="red"
            icon={<TrendingDown />}
          />
          <StatCard
            label="Comissões + Pagamentos"
            value={formatCurrency(stats.comissoes + stats.pagamentos)}
            color="yellow"
            icon={<Users />}
          />
          <StatCard
            label="Resultado do Mês"
            value={formatCurrency(stats.resultado)}
            color={stats.resultado >= 0 ? 'green' : 'red'}
            icon={<DollarSign />}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {monthTransactions.map((t) => (
            <Card key={t.id} className="p-4" hoverable>
              <div className="flex items-center gap-4">
                {getTypeIcon(t.tipo)}

                <div className="flex-1">
                  <p className="font-medium text-gray-900">{t.descricao}</p>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>{t.categoria}</span>
                    {t.leadId && <span>• {getLeadName(t.leadId)}</span>}
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {t.tipo === 'receita' ? '+' : '-'}
                    {formatCurrency(t.valor)}
                  </p>
                </div>

                {/* 🔥 BOTÕES NOVOS */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTransaction(t);
                      setShowEditModal(true);
                    }}
                  >
                    ✏️
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CREATE */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Transação"
      >
        <TransactionForm onClose={() => setShowModal(false)} />
      </Modal>

      {/* 🔥 EDIT */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Transação"
      >
        <TransactionForm
          initialData={editingTransaction}
          onClose={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
}

function TransactionForm({ onClose, initialData }: any) {
  const leads = useStore((state) => state.leads);
  const addTransaction = useStore((state) => state.addTransaction);
  const updateTransaction = useStore((state) => state.updateTransaction);

  const isEditing = !!initialData;

  const [tipo, setTipo] = useState(initialData?.tipo || 'receita');
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [valor, setValor] = useState(initialData?.valor || 0);
  const [data, setData] = useState(
    initialData?.data || format(new Date(), 'yyyy-MM-dd'),
  );
  const [categoria, setCategoria] = useState(
    initialData?.categoria || 'Serviços',
  );
  const [leadId, setLeadId] = useState(initialData?.leadId || '');
  const [observacoes, setObservacoes] = useState(
    initialData?.observacoes || '',
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      await updateTransaction(initialData.id, {
        tipo,
        descricao,
        valor,
        data,
        categoria,
        leadId: leadId || undefined,
        observacoes,
      });
    } else {
      await addTransaction({
        tipo,
        descricao,
        valor,
        data,
        categoria,
        leadId: leadId || undefined,
        observacoes,
      });
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <Select
        label="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        options={tipoOptions}
      />
      <Input
        label="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
        />
        <Input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </div>

      <Select
        label="Categoria"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        options={categoriaOptions}
      />

      <TextArea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
      />

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {isEditing ? 'Salvar Alterações' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}
