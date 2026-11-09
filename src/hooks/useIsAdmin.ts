import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { apiFetch } from '@/lib/apiFetch';

// Admin = está na whitelist ADMIN_USER_IDS do backend, a mesma que protege as
// rotas /api/admin/*. O role 'owner' do workspace não conta: todo cliente é
// owner da própria empresa. Sem resposta 200 (403, backend fora, erro de rede),
// não é admin e o menu "Empresas" fica escondido.
export function useIsAdmin() {
  const workspaceId = useStore((s) => s.workspaceId);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    async function check() {
      try {
        // Sem retry: só decide a visibilidade de um item de menu.
        const res = await apiFetch('/api/admin/me', {}, 0);
        setIsAdmin(res.ok);
      } catch {
        setIsAdmin(false);
      }
    }

    check();
  }, [workspaceId]);

  return isAdmin;
}
