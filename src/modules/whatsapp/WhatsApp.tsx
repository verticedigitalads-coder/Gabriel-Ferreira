import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ArrowLeft,
  MessageCircle,
  Image as ImageIcon,
  Mic,
  Video as VideoIcon,
  FileText,
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import { formatPhone } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { WhatsappConversation, WhatsappMessage } from '@/types';

const isGroup = (jid: string) => jid.endsWith('@g.us');

function jidToPhone(jid: string): string {
  const local = jid.split('@')[0];
  if (isGroup(jid)) return local;
  return formatPhone(local) || local;
}

function parseTs(ts: string | null): Date | null {
  if (!ts) return null;
  if (/^\d+$/.test(ts)) {
    const n = Number(ts);
    return new Date(n < 1e12 ? n * 1000 : n);
  }
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function formatListTime(ts: string | null): string {
  const d = parseTs(ts);
  if (!d) return '';
  return isToday(d)
    ? format(d, 'HH:mm', { locale: ptBR })
    : format(d, 'dd/MM', { locale: ptBR });
}

function formatMsgTime(ts: string | null): string {
  const d = parseTs(ts);
  return d ? format(d, 'HH:mm', { locale: ptBR }) : '';
}

const TYPE_META: Record<string, { label: string; Icon: any }> = {
  image: { label: 'Imagem', Icon: ImageIcon },
  audio: { label: 'Áudio', Icon: Mic },
  video: { label: 'Vídeo', Icon: VideoIcon },
  document: { label: 'Documento', Icon: FileText },
};

function displayName(c: { contactName: string | null; remoteJid: string }): string {
  return c.contactName?.trim() || jidToPhone(c.remoteJid);
}

function MessageBubble({ msg }: { msg: WhatsappMessage }) {
  const meta = TYPE_META[msg.messageType];
  const mine = msg.fromMe;

  return (
    <div className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
      <div
        className="max-w-[80%] md:max-w-[65%] rounded-[var(--radius-lg)] px-3 py-2"
        style={{
          background: mine ? 'var(--accent-subtle)' : 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {meta ? (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <meta.Icon className="w-4 h-4 shrink-0" />
            <span>{msg.content?.trim() || meta.label}</span>
          </div>
        ) : (
          <p
            className="text-sm whitespace-pre-wrap break-words"
            style={{ color: 'var(--text-primary)' }}
          >
            {msg.content || ''}
          </p>
        )}
        <div
          className="text-[10px] mt-1 text-right"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {formatMsgTime(msg.timestamp)}
        </div>
      </div>
    </div>
  );
}

export function WhatsApp() {
  const conversations = useStore(
    (s) => s.whatsappConversations,
  ) as WhatsappConversation[];
  const messages = useStore((s) => s.whatsappMessages) as WhatsappMessage[];
  const selectedConversation = useStore((s) => s.selectedConversation);
  const fetchConversations = useStore((s) => s.fetchConversations);
  const setSelectedConversation = useStore((s) => s.setSelectedConversation);

  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = displayName(c).toLowerCase();
      const jid = c.remoteJid.toLowerCase();
      return name.includes(q) || jid.includes(q);
    });
  }, [conversations, search]);

  const active = conversations.find(
    (c) => c.remoteJid === selectedConversation,
  );

  const hasSelection = !!selectedConversation;

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* ===== Lista de conversas ===== */}
      <div
        className={cn(
          'flex-col w-full md:w-[30%] md:flex md:border-r',
          hasSelection ? 'hidden' : 'flex',
        )}
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="p-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h1
            className="text-base font-semibold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            WhatsApp
          </h1>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full pl-9 pr-3 rounded-[var(--radius-md)] text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-3xl mb-3 opacity-30">💬</div>
              <p
                className="text-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {search
                  ? 'Nenhuma conversa encontrada'
                  : 'Nenhuma conversa ainda'}
              </p>
            </div>
          ) : (
            filtered.map((c) => {
              const isActive = c.remoteJid === selectedConversation;
              const name = displayName(c);
              const preview =
                TYPE_META[c.lastMessageType]?.label ?? c.lastContent ?? '';
              return (
                <button
                  key={c.remoteJid}
                  onClick={() => setSelectedConversation(c.remoteJid)}
                  className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-left transition-colors"
                  style={{
                    background: isActive
                      ? 'var(--accent-subtle)'
                      : 'transparent',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {name}
                      </span>
                      <span
                        className="text-[10px] shrink-0"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {formatListTime(c.lastTimestamp)}
                      </span>
                    </div>
                    <p
                      className="text-xs truncate"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {c.lastFromMe ? 'Você: ' : ''}
                      {preview}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ===== Chat ===== */}
      <div
        className={cn(
          'flex-col flex-1 md:flex',
          hasSelection ? 'flex' : 'hidden md:flex',
        )}
      >
        {active ? (
          <>
            <div
              className="flex items-center gap-3 p-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                {displayName(active).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {displayName(active)}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {jidToPhone(active.remoteJid)}
                </div>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-2"
              style={{ background: 'var(--bg-app)' }}
            >
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
              <div ref={bottomRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle
              className="w-12 h-12 mb-4 opacity-20"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <p
              className="text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Selecione uma conversa para ver as mensagens
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
