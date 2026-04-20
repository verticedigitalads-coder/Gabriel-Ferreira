import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';

export function useNotifications() {
  const tasks = useStore((state) => state.operacionalTasks) || [];
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const tarefasHoje = tasks.filter(
    (t) => t.data === hoje && !t.concluido
  );

  const tarefasAtrasadas = tasks.filter(
    (t) => t.data < hoje && !t.concluido
  );

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const sendNotification = useCallback((title: string, body: string, tag?: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        tag: tag || 'crm-notification',
        renotify: true,
      });
    } catch (e) {
      console.warn('[Notifications] Não foi possível enviar:', e);
    }
  }, []);

  const sendResumo = useCallback(() => {
    const totalHoje = tarefasHoje.length;
    const totalAtrasadas = tarefasAtrasadas.length;

    if (totalHoje === 0 && totalAtrasadas === 0) return;

    let body = '';
    if (totalHoje > 0) {
      body += `${totalHoje} tarefa${totalHoje > 1 ? 's' : ''} para hoje`;
    }
    if (totalAtrasadas > 0) {
      if (body) body += ' | ';
      body += `${totalAtrasadas} atrasada${totalAtrasadas > 1 ? 's' : ''}`;
    }

    const altaPrioridade = tarefasHoje.filter((t) => t.prioridade === 'alta');
    if (altaPrioridade.length > 0) {
      body += ` | ${altaPrioridade.length} urgente${altaPrioridade.length > 1 ? 's' : ''}!`;
    }

    sendNotification('Vértice CRM — Operacional', body, 'crm-resumo-diario');
  }, [tarefasHoje, tarefasAtrasadas, sendNotification]);

  useEffect(() => {
    const total = tarefasHoje.length + tarefasAtrasadas.length;
    const baseTitle = 'Vértice Digital | CRM Inteligente';

    if (total > 0) {
      document.title = `(${total}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    return () => {
      document.title = baseTitle;
    };
  }, [tarefasHoje.length, tarefasAtrasadas.length]);

  const setupNotifications = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return;

    setTimeout(() => {
      sendResumo();
    }, 3000);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      sendResumo();
    }, 30 * 60 * 1000);
  }, [requestPermission, sendResumo]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    requestPermission,
    sendNotification,
    sendResumo,
    setupNotifications,
    tarefasHoje: tarefasHoje.length,
    tarefasAtrasadas: tarefasAtrasadas.length,
    permissionGranted: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted',
  };
}
