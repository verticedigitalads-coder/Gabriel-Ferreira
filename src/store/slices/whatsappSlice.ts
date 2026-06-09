import { supabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/apiFetch'
import { formatWhatsappMessage } from '@/store/formatters'
import type { WhatsappConversation, WhatsappMessage } from '@/types'

const toConversation = (m: WhatsappMessage): WhatsappConversation => ({
  remoteJid: m.remoteJid,
  contactName: m.contactName,
  lastContent: m.content,
  lastFromMe: m.fromMe,
  lastMessageType: m.messageType,
  lastTimestamp: m.timestamp,
})

const jidToNumber = (jid: string): string =>
  (jid.split('@')[0] || '').replace(/\D/g, '')

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createWhatsappSlice = (set: any, get: any) => ({

  whatsappConversations: [],
  whatsappMessages: [],
  selectedConversation: null,
  whatsappInstanceName: null,
  connectionStatus: null,
  sendingMessage: false,
  whatsappContacts: {} as Record<string, string>,

  fetchConversations: async () => {
    const { workspaceId } = get()
    if (!workspaceId) return

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('[WhatsappSlice] Erro ao buscar conversas:', error)
      return
    }

    const seen = new Set<string>()
    const conversations: WhatsappConversation[] = []

    for (const raw of data || []) {
      const msg = formatWhatsappMessage(raw)
      if (seen.has(msg.remoteJid)) continue
      seen.add(msg.remoteJid)
      conversations.push(toConversation(msg))
    }

    set({ whatsappConversations: conversations })
  },

  fetchMessages: async (remoteJid: string) => {
    const { workspaceId } = get()
    if (!workspaceId) return

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('remote_jid', remoteJid)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('[WhatsappSlice] Erro ao buscar mensagens:', error)
      return
    }

    set({ whatsappMessages: (data || []).map(formatWhatsappMessage) })
  },

  setSelectedConversation: (remoteJid: string | null) => {
    set({ selectedConversation: remoteJid })
    if (remoteJid) {
      get().fetchMessages(remoteJid)
    } else {
      set({ whatsappMessages: [] })
    }
  },

  fetchWhatsappInstance: async () => {
    const { workspaceId } = get()
    if (!workspaceId) return

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('workspace_id', workspaceId)
      .limit(1)

    if (error) {
      console.error('[WhatsappSlice] Erro ao buscar instância:', error)
      return
    }

    set({ whatsappInstanceName: data?.[0]?.instance_name ?? null })
  },

  fetchConnectionStatus: async () => {
    const { whatsappInstanceName } = get()
    if (!whatsappInstanceName) return

    try {
      const res = await apiFetch(
        `/api/whatsapp/status/${encodeURIComponent(whatsappInstanceName)}`,
      )
      if (!res.ok) {
        set({ connectionStatus: 'unknown' })
        return
      }
      const data = await res.json()
      set({
        connectionStatus:
          data?.instance?.state ?? data?.state ?? 'unknown',
      })
    } catch {
      set({ connectionStatus: 'unknown' })
    }
  },

  fetchContacts: async () => {
    const { whatsappInstanceName } = get()
    if (!whatsappInstanceName) return
    try {
      const res = await apiFetch(
        `/api/whatsapp/contacts/${encodeURIComponent(whatsappInstanceName)}`,
      )
      if (!res.ok) return
      const list: Array<{ pushName: string; number: string }> = await res.json()
      const counts: Record<string, number> = {}
      const map: Record<string, string> = {}
      for (const c of list) {
        const key = (c.pushName || '').trim().toLowerCase()
        if (!key) continue
        counts[key] = (counts[key] || 0) + 1
        if (!map[key]) map[key] = c.number
      }
      for (const key of Object.keys(counts)) {
        if (counts[key] > 1) delete map[key]
      }
      set({ whatsappContacts: map })
    } catch {
      /* silencioso — recurso opcional */
    }
  },

  sendMessage: async (text: string, overrideNumber?: string) => {
    const { selectedConversation, whatsappInstanceName } = get()
    const body = text.trim()
    if (!body || !selectedConversation) return
    if (!whatsappInstanceName) {
      get().addToast({
        type: 'error',
        message: 'Instância WhatsApp não configurada para este workspace',
      })
      return
    }

    if (selectedConversation.includes('@g.us')) {
      get().addToast({ type: 'error', message: 'Envio para grupos não disponível' })
      return
    }

    if (selectedConversation.includes('@lid') && !overrideNumber?.trim()) {
      get().addToast({
        type: 'error',
        message: 'Informe o número de telefone para este contato (LID).',
      })
      return
    }

    const numberToSend = overrideNumber?.trim() || selectedConversation

    set({ sendingMessage: true })
    try {
      const res = await apiFetch('/api/whatsapp/send-text', {
        method: 'POST',
        body: JSON.stringify({
          instanceName: whatsappInstanceName,
          number: numberToSend,
          text: body,
          originalJid: selectedConversation,
        }),
      })
      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        console.error('[Whatsapp send-text]', res.status, errBody)
        get().addToast({
          type: 'error',
          message: `Erro ao enviar (${res.status})`,
        })
      }
    } catch (err) {
      console.error('[Whatsapp send-text] exception', err)
      get().addToast({ type: 'error', message: 'Erro ao enviar mensagem' })
    } finally {
      set({ sendingMessage: false })
    }
  },

  deleteConversation: async (remoteJid: string) => {
    const { workspaceId } = get()
    if (!workspaceId) return

    const { error } = await supabase
      .from('whatsapp_messages')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('remote_jid', remoteJid)

    if (error) {
      console.error('[WhatsappSlice] Erro ao limpar conversa:', error)
      get().addToast({ type: 'error', message: 'Erro ao limpar conversa' })
      return
    }

    set((state: any) => {
      const isSelected = state.selectedConversation === remoteJid
      return {
        whatsappConversations: state.whatsappConversations.filter(
          (c: WhatsappConversation) => c.remoteJid !== remoteJid,
        ),
        selectedConversation: isSelected ? null : state.selectedConversation,
        whatsappMessages: isSelected ? [] : state.whatsappMessages,
      }
    })

    get().addToast({ type: 'success', message: 'Conversa limpa' })
  },

})
