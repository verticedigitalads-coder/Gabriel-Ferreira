import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export function useWorkspaceSegment() {
  const workspaceId = useStore((s) => s.workspaceId);
  const [segment, setSegment] = useState<'metalurgica' | 'marcenaria'>('metalurgica');

  useEffect(() => {
    if (!workspaceId) return;

    supabase
      .from('workspaces')
      .select('segment')
      .eq('id', workspaceId)
      .single()
      .then(({ data }) => {
        if (data?.segment) setSegment(data.segment);
      });
  }, [workspaceId]);

  return segment;
}
