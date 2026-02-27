import { AlertTriangle, Database, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function Settings() {
  const initialize = useStore(state => state.initialize);
  const addToast = useStore(state => state.addToast);

  const [loading, setLoading] = useState(false);

  const confirmAction = (message: string) => {
    return window.confirm(message);
  };

  // 🧹 LIMPAR LEADS
  const clearLeadsOnly = async () => {
    if (!confirmAction('Deseja apagar todos os LEADS?')) return;

    const request = indexedDB.open('crm-pro-db');

    request.onsuccess = function () {
      const database = request.result;
      const tx = database.transaction(['leads'], 'readwrite');
      tx.objectStore('leads').clear();
      tx.oncomplete = () => window.location.reload();
    };
  };

  // 🧹 LIMPAR FINANCEIRO
  const clearFinancialOnly = async () => {
    if (!confirmAction('Deseja apagar ORÇAMENTOS, TRANSAÇÕES e NOTAS?')) return;

    const request = indexedDB.open('crm-pro-db');

    request.onsuccess = function () {
      const database = request.result;
      const tx = database.transaction(['orcamentos', 'transactions', 'notas'], 'readwrite');
      tx.objectStore('orcamentos').clear();
      tx.objectStore('transactions').clear();
      tx.objectStore('notas').clear();
      tx.oncomplete = () => window.location.reload();
    };
  };

  // 🔥 RESET COMPLETO
  const resetSystem = async () => {
    if (!confirmAction('⚠️ Isso apagará TODOS os dados. Deseja continuar?')) return;

    setLoading(true);

    const request = indexedDB.deleteDatabase('crm-pro-db');

    request.onsuccess = () => {
      localStorage.clear();
      window.location.reload();
    };

    request.onerror = () => {
      setLoading(false);
    };
  };

  const generateSeed = async () => {
    if (!confirmAction('Gerar dados de exemplo?')) return;

    setLoading(true);
    await initialize();
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Configurações do Sistema
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Controle administrativo do CRM
        </p>
      </div>

      {/* 🔧 ADMINISTRATIVO */}
      <Card className="p-6 space-y-4 border border-gray-200">

        <Button
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={generateSeed}
          disabled={loading}
        >
          <Trash2 className="w-4 h-4" />
          Gerar Seed Manual
        </Button>

        <Button
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={clearLeadsOnly}
        >
          <Trash2 className="w-4 h-4" />
          Limpar Apenas Leads
        </Button>

        <Button
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={clearFinancialOnly}
        >
          <Trash2 className="w-4 h-4" />
          Limpar Apenas Financeiro
        </Button>

        <div className="border-t pt-4 mt-4">
          <Button
            className="w-full justify-start gap-2 bg-red-600 hover:bg-red-700"
            onClick={resetSystem}
            disabled={loading}
          >
            <AlertTriangle className="w-4 h-4" />
            Resetar Sistema Completo
          </Button>
        </div>

      </Card>

    </div>
  );
}