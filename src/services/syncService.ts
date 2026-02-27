import { getAllLeads, saveLead } from '@/lib/db';
import { useStore } from '@/store/useStore';
import type { Lead } from '@/types';

// Buscar leads que precisam sincronizar
export async function getLeadsToSync(): Promise<Lead[]> {
  const workspaceId = useStore.getState().workspaceId;

  if (!workspaceId) return [];

  const leads = await getAllLeads(workspaceId);

  return leads.filter(
    (lead: any) =>
      lead.syncStatus === 'local' ||
      lead.syncStatus === 'pending'
  );
}

// Marcar múltiplos como sincronizados
export async function markMultipleAsSynced(ids: string[]) {
  const workspaceId = useStore.getState().workspaceId;

  if (!workspaceId) return;

  const leads = await getAllLeads(workspaceId);

  for (const lead of leads) {
    if (ids.includes(lead.id)) {
      await saveLead({
        ...lead,
        syncStatus: 'synced',
        updatedAt: new Date().toISOString(),
      } as any);
    }
  }
}