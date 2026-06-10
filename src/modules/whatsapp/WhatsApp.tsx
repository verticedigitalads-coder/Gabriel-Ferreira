import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ArrowLeft,
  MessageCircle,
  Image as ImageIcon,
  Mic,
  Video as VideoIcon,
  FileText,
  Send,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import { apiFetch } from '@/lib/apiFetch';
import { formatPhone } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { WhatsappConversation, WhatsappMessage } from '@/types';

const CONNECTED_STATES = ['open', 'connected'];

const isGroup = (jid: string) => jid.endsWith('@g.us');
const isLid = (jid: string) => jid.endsWith('@lid');

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

function getQuotedText(msg: WhatsappMessage): string | null {
  const ctx =
    msg.rawData?.message?.extendedTextMessage?.contextInfo ??
    msg.rawData?.message?.imageMessage?.contextInfo ??
    null;
  const q = ctx?.quotedMessage;
  if (!q) return null;
  return (
    q.conversation ||
    q.extendedTextMessage?.text ||
    q.imageMessage?.caption ||
    null
  );
}

function WhatsAppImage({
  messageId,
  instanceName,
  caption,
}: {
  messageId: string;
  instanceName: string;
  caption?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/whatsapp/media/${instanceName}/${messageId}`);
        const data = await res.json();
        if (alive && data?.base64) {
          setSrc(`data:${data.mimetype || 'image/jpeg'};base64,${data.base64}`);
        } else if (alive) {
          setError(true);
        }
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [messageId, instanceName]);

  if (error)
    return (
      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        📷 Imagem indisponível
      </span>
    );
  if (!src)
    return (
      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        📷 Carregando…
      </span>
    );
  return (
    <div>
      <img
        src={src}
        alt="imagem"
        style={{
          maxWidth: 280,
          maxHeight: 300,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
        }}
        onClick={() => window.open(src, '_blank')}
      />
      {caption && (
        <div className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
          {caption}
        </div>
      )}
    </div>
  );
}

function WhatsAppAudio({
  messageId,
  instanceName,
}: {
  messageId: string;
  instanceName: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/whatsapp/media/${instanceName}/${messageId}`);
        const data = await res.json();
        if (alive && data?.base64) {
          setSrc(`data:${data.mimetype || 'audio/ogg'};base64,${data.base64}`);
        } else if (alive) {
          setError(true);
        }
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [messageId, instanceName]);

  if (error)
    return (
      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        🎵 Áudio indisponível
      </span>
    );
  if (!src)
    return (
      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        🎵 Carregando…
      </span>
    );
  return <audio controls src={src} style={{ maxWidth: 260, height: 36 }} />;
}

function MessageBubble({
  msg,
  instanceName,
}: {
  msg: WhatsappMessage;
  instanceName: string | null;
}) {
  const meta = TYPE_META[msg.messageType];
  const mine = msg.fromMe;
  const quotedText = getQuotedText(msg);
  const canMedia = !!msg.messageId && !!instanceName;
  const captionText =
    msg.content && msg.content.trim() !== '[Imagem]' ? msg.content : undefined;

  return (
    <div className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
      <div
        className="max-w-[80%] md:max-w-[65%] rounded-[var(--radius-lg)] px-3 py-2"
        style={{
          background: mine ? 'var(--accent-subtle)' : 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {quotedText && (
          <div
            className="text-xs mb-1 px-2 py-1 truncate"
            style={{
              borderLeft: '3px solid var(--accent)',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              background: 'var(--bg-surface-2)',
              color: 'var(--text-secondary)',
            }}
          >
            {quotedText.length > 80 ? quotedText.slice(0, 80) + '…' : quotedText}
          </div>
        )}
        {msg.messageType === 'image' && canMedia ? (
          <WhatsAppImage
            messageId={msg.messageId as string}
            instanceName={instanceName as string}
            caption={captionText}
          />
        ) : msg.messageType === 'audio' && canMedia ? (
          <WhatsAppAudio
            messageId={msg.messageId as string}
            instanceName={instanceName as string}
          />
        ) : meta ? (
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
  const whatsappInstanceName = useStore((s) => s.whatsappInstanceName);
  const connectionStatus = useStore((s) => s.connectionStatus);
  const sendingMessage = useStore((s) => s.sendingMessage);
  const fetchWhatsappInstance = useStore((s) => s.fetchWhatsappInstance);
  const fetchConnectionStatus = useStore((s) => s.fetchConnectionStatus);
  const sendMessage = useStore((s) => s.sendMessage);
  const deleteConversation = useStore((s) => s.deleteConversation);
  const whatsappContacts = useStore((s) => s.whatsappContacts);
  const fetchContacts = useStore((s) => s.fetchContacts);

  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [manualNumberByJid, setManualNumberByJid] = useState<Record<string, string>>({});
  const [suggestedJids, setSuggestedJids] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchWhatsappInstance();
  }, [fetchConversations, fetchWhatsappInstance]);

  useEffect(() => {
    if (whatsappInstanceName) {
      fetchConnectionStatus();
      fetchContacts();
    }
  }, [whatsappInstanceName, fetchConnectionStatus, fetchContacts]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connected = !!connectionStatus && CONNECTED_STATES.includes(connectionStatus);

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

  const activeIsGroup = active ? isGroup(active.remoteJid) : false;
  const activeIsLid = active ? isLid(active.remoteJid) : false;
  const manualNumber = active ? (manualNumberByJid[active.remoteJid] ?? '') : '';
  const lidNumberValid = manualNumber.replace(/\D/g, '').length >= 10;
  const resolvedNumber = active?.contactName
    ? whatsappContacts[active.contactName.trim().toLowerCase()] ?? null
    : null;
  const isSuggested = !!active && !!suggestedJids[active.remoteJid] && !!manualNumber;
  const canSend =
    !!active &&
    !activeIsGroup &&
    (!activeIsLid || lidNumberValid) &&
    !!draft.trim() &&
    !sendingMessage;

  useEffect(() => {
    if (active && activeIsLid && resolvedNumber) {
      setManualNumberByJid((m) => {
        if (m[active.remoteJid]) return m;
        setSuggestedJids((s) => ({ ...s, [active.remoteJid]: true }));
        return { ...m, [active.remoteJid]: resolvedNumber };
      });
    }
  }, [active, activeIsLid, resolvedNumber]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sendingMessage || !active) return;
    if (activeIsGroup) return;
    if (activeIsLid && !lidNumberValid) return;
    sendMessage(text, activeIsLid ? manualNumber.replace(/\D/g, '') : undefined);
    setDraft('');
  };

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
              <div className="min-w-0 flex-1">
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
                  {activeIsLid
                    ? resolvedNumber
                      ? formatPhone(resolvedNumber)
                      : 'Número não identificado'
                    : jidToPhone(active.remoteJid)}
                </div>
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-md)]"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label="Mais ações"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 mt-1 z-50 w-56 rounded-[var(--radius-md)] overflow-hidden"
                      style={{
                        background: 'var(--bg-surface-2)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <div
                        className="flex items-center gap-2 px-4 py-3 text-xs"
                        style={{
                          color: 'var(--text-secondary)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background: connected
                              ? 'var(--success)'
                              : 'var(--danger)',
                          }}
                        />
                        {connected
                          ? 'Conectado'
                          : `Desconectado${
                              connectionStatus ? ` (${connectionStatus})` : ''
                            }`}
                      </div>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmClear(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left min-h-[44px]"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        Limpar conversa
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-2"
              style={{ background: 'var(--bg-app)' }}
            >
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} instanceName={whatsappInstanceName} />
              ))}
              <div ref={bottomRef} />
            </div>

            {activeIsGroup && (
              <div
                className="shrink-0 px-4 py-3 text-xs"
                style={{
                  background: 'var(--warning-subtle)',
                  color: 'var(--warning)',
                  borderTop: '1px solid var(--border)',
                }}
              >
                Envio para grupos não disponível nesta fase.
              </div>
            )}

            {activeIsLid && !activeIsGroup && (
              <div
                className="shrink-0 flex flex-col gap-2 px-4 py-3"
                style={{
                  background: 'var(--info-subtle)',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs" style={{ color: 'var(--info)' }}>
                    {isSuggested
                      ? 'Número sugerido a partir dos seus contatos. Confira antes de enviar.'
                      : 'Este contato usa ID interno. Digite o número com DDI+DDD para enviar.'}
                  </span>
                  {isSuggested && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-sm)] shrink-0"
                      style={{
                        background: 'var(--info)',
                        color: 'var(--accent-foreground)',
                      }}
                    >
                      sugerido
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Ex: 5511987654321"
                    value={manualNumber}
                    onChange={(e) => {
                      const v = e.target.value;
                      setManualNumberByJid((m) => ({
                        ...m,
                        [active!.remoteJid]: v,
                      }));
                      setSuggestedJids((s) => ({ ...s, [active!.remoteJid]: false }));
                    }}
                    className="flex-1 px-3 rounded-[var(--radius-md)] text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{
                      background: 'var(--bg-surface-2)',
                      border: isSuggested
                        ? '1px solid var(--info)'
                        : '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {isSuggested && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualNumberByJid((m) => ({
                          ...m,
                          [active!.remoteJid]: '',
                        }));
                        setSuggestedJids((s) => ({ ...s, [active!.remoteJid]: false }));
                      }}
                      className="flex items-center justify-center gap-1 min-h-[44px] px-3 rounded-[var(--radius-md)] text-xs shrink-0"
                      style={{
                        background: 'var(--bg-surface-2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                      aria-label="Limpar número sugerido"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            )}

            <div
              className="shrink-0 flex items-end gap-2 p-3 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                disabled={activeIsGroup}
                placeholder={
                  activeIsGroup ? 'Envio desabilitado' : 'Digite uma mensagem...'
                }
                className="flex-1 resize-none px-3 py-2 rounded-[var(--radius-md)] text-sm min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-md)] disabled:opacity-50 transition-opacity"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                }}
                aria-label="Enviar mensagem"
              >
                <Send className="w-5 h-5" />
              </button>
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

      <ConfirmDialog
        isOpen={confirmClear}
        title="Limpar conversa"
        description="Isso vai apagar todas as mensagens desta conversa. Esta ação não pode ser desfeita."
        confirmText="Limpar"
        onConfirm={() => {
          if (selectedConversation) deleteConversation(selectedConversation);
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
