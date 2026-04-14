import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export function useIsAdmin() {
  const workspaceId = useStore((s) => s.workspaceId);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    async function check() {
      // getSession() lê do cache local — sem chamada de rede
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) return;

      const { data: member } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();

      setIsAdmin(member?.role === 'owner');
    }

    check();
  }, [workspaceId]);

  return isAdmin;
}
