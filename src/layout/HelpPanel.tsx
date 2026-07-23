import { useEffect, useRef, useState } from 'react';
import { Send, HelpCircle, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SlidePanel } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { apiFetch } from '@/lib/apiFetch';
import { buildSupportWhatsappUrl } from '@/lib/support';
import { cn } from '@/utils/cn';

interface HelpMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTION_CHIPS = [
  'Como criar meu primeiro orçamento?',
  'Como configurar meu PIX?',
  'Como conectar o WhatsApp?',
];

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  const activeModule = useStore(s => s.activeModule);
  const addToast = useStore(s => s.addToast);

  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content;

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: HelpMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const historyForRequest = [...messages, userMsg]
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setDraft('');
    setSending(true);

    try {
      const res = await apiFetch('/api/help-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: trimmed,
          history: historyForRequest,
          activeModule,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data.reply as string },
      ]);
    } catch (error) {
      console.error('[HelpPanel] Erro ao chamar /api/help-chat:', error);
      addToast({ type: 'error', message: 'Não foi possível falar com a Central de Ajuda agora.' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(draft);
    }
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Central de Ajuda">
      <div className="flex flex-col h-full">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2" style={{ background: 'var(--bg-app)' }}>
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'var(--ia-subtle)' }}
              >
                <HelpCircle className="w-7 h-7" style={{ color: 'var(--ia)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Como posso ajudar?
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Pergunte qualquer coisa sobre como usar o CRM.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {SUGGESTION_CHIPS.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="w-full text-left text-sm px-3 py-2.5 rounded-[var(--radius-md)] border transition-colors min-h-[44px]"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(m => (
                <div key={m.id} className={cn('flex w-full', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className="max-w-[85%] rounded-[var(--radius-lg)] px-3 py-2"
                    style={{
                      background: m.role === 'user' ? 'var(--accent-subtle)' : 'var(--ia-subtle)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {m.role === 'assistant' ? (
                      <div
                        className="text-sm break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                        {m.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex w-full justify-start">
                  <div
                    className="rounded-[var(--radius-lg)] px-3 py-2"
                    style={{ background: 'var(--ia-subtle)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Central de Ajuda está digitando...
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 flex items-end gap-2 p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending}
            placeholder="Digite sua dúvida..."
            className="flex-1 resize-none px-3 py-2 rounded-[var(--radius-md)] text-sm min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => handleSend(draft)}
            disabled={sending || !draft.trim()}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[var(--radius-md)] disabled:opacity-50 transition-opacity"
            style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
            aria-label="Enviar mensagem"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Falar com suporte */}
        <div className="shrink-0 p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <a
            href={buildSupportWhatsappUrl(lastUserMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 text-sm font-medium px-3 py-2.5 rounded-[var(--radius-md)] transition-colors min-h-[44px]"
            style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}
          >
            <MessageCircle className="w-4 h-4" />
            Falar com suporte
          </a>
        </div>
      </div>
    </SlidePanel>
  );
}
