// ═══════════════════════════════════════════════════════════════════════════
// INDEXEDDB - Banco de Dados Local Offline-First
// ═══════════════════════════════════════════════════════════════════════════

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  Lead,
  Orcamento,
  Transaction,
  Nota,
  Workspace,
  OperacionalTask
} from '@/types';

interface CRMDatabase extends DBSchema {
  workspaces: {
    key: string;
    value: Workspace;
  };

  leads: {
    key: string;
    value: Lead;
    indexes: {
      'by-workspace': string;
      'by-status': string;
      'by-temperatura': string;
      'by-prioridade': number;
    };
  };

  orcamentos: {
    key: string;
    value: Orcamento;
    indexes: {
      'by-workspace': string;
      'by-lead': string;
      'by-status': string;
    };
  };

  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-workspace': string;
      'by-tipo': string;
      'by-data': string;
    };
  };

  notas: {
    key: string;
    value: Nota;
    indexes: {
      'by-workspace': string;
      'by-status': string;
    };
  };

  operacionalTasks: {
    key: string;
    value: OperacionalTask;
    indexes: {
      'by-workspace': string;
      'by-data': string;
    };
  };
}

const DB_NAME = 'crm-pro-db';
const DB_VERSION = 3;

let dbInstance: IDBPDatabase<CRMDatabase> | null = null;

export async function getDB(): Promise<IDBPDatabase<CRMDatabase>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<CRMDatabase>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    console.log("UPGRADE EXECUTANDO");

    try {

      if (!db.objectStoreNames.contains('workspaces')) {
        db.createObjectStore('workspaces', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('leads')) {
        const store = db.createObjectStore('leads', { keyPath: 'id' });
        store.createIndex('by-workspace', 'workspaceId');
        store.createIndex('by-status', 'status');
        store.createIndex('by-temperatura', 'temperatura');
        store.createIndex('by-prioridade', 'prioridadeScore');
      }

      if (!db.objectStoreNames.contains('orcamentos')) {
        const store = db.createObjectStore('orcamentos', { keyPath: 'id' });
        store.createIndex('by-workspace', 'workspaceId');
        store.createIndex('by-lead', 'leadId');
        store.createIndex('by-status', 'status');
      }

      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('by-workspace', 'workspaceId');
        store.createIndex('by-tipo', 'tipo');
        store.createIndex('by-data', 'data');
      }

      if (!db.objectStoreNames.contains('notas')) {
        const store = db.createObjectStore('notas', { keyPath: 'id' });
        store.createIndex('by-workspace', 'workspaceId');
        store.createIndex('by-status', 'status');
      }

      if (!db.objectStoreNames.contains('operacionalTasks')) {
        const store = db.createObjectStore('operacionalTasks', { keyPath: 'id' });
        store.createIndex('by-workspace', 'workspaceId');
        store.createIndex('by-data', 'data');
      }

    } catch (err) {
      console.error("ERRO NO UPGRADE:", err);
    }
  },
});

  return dbInstance;
}

// ================= LEADS =================

export async function getAllLeads(workspaceId: string) {
  const db = await getDB();
  return db.getAllFromIndex('leads', 'by-workspace', workspaceId);
}

export async function saveLead(lead: Lead) {
  const db = await getDB();
  await db.put('leads', lead);
}

export async function deleteLead(id: string) {
  const db = await getDB();
  await db.delete('leads', id);
}

// ================= ORCAMENTOS =================

export async function getAllOrcamentos(workspaceId: string) {
  const db = await getDB();
  return db.getAllFromIndex('orcamentos', 'by-workspace', workspaceId);
}

export async function saveOrcamento(orcamento: Orcamento) {
  const db = await getDB();
  await db.put('orcamentos', orcamento);
}

export async function deleteOrcamento(id: string) {
  const db = await getDB();
  await db.delete('orcamentos', id);
}

// ================= TRANSACTIONS =================

export async function getAllTransactions(workspaceId: string) {
  const db = await getDB();
  return db.getAllFromIndex('transactions', 'by-workspace', workspaceId);
}

export async function saveTransaction(transaction: Transaction) {
  const db = await getDB();
  await db.put('transactions', transaction);
}

export async function deleteTransaction(id: string) {
  const db = await getDB();
  await db.delete('transactions', id);
}

// ================= NOTAS =================

export async function getAllNotas(workspaceId: string) {
  const db = await getDB();
  return db.getAllFromIndex('notas', 'by-workspace', workspaceId);
}

export async function saveNota(nota: Nota) {
  const db = await getDB();
  await db.put('notas', nota);
}

export async function deleteNota(id: string) {
  const db = await getDB();
  await db.delete('notas', id);
}

// ================= OPERACIONAL =================

export async function getAllOperacionalTasks(workspaceId: string) {
  const db = await getDB();
  return db.getAllFromIndex('operacionalTasks', 'by-workspace', workspaceId);
}

export async function saveOperacionalTask(task: OperacionalTask) {
  const db = await getDB();
  await db.put('operacionalTasks', task);
}

export async function deleteOperacionalTaskDB(id: string) {
  const db = await getDB();
  await db.delete('operacionalTasks', id);
}