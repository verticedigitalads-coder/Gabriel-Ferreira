import { supabase } from '@/lib/supabase'
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

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createWhatsappSlice = (set: any, get: any) => ({

  whatsappConversations: [],
  whatsappMessages: [],
  selectedConversation: null,

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

})
