import { supabase } from './supabase'

const ACTIVE_WORKSPACE_KEY = 'vrtx_active_workspace_id'

export async function ensureWorkspaceForUser() {
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return null

  const userId = userData.user.id

  const { data: memberships, error } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !memberships || memberships.length === 0) {
    console.error('Usuário não pertence a nenhum workspace')
    return null
  }

  if (memberships.length === 1) {
    const workspaceId = memberships[0].workspace_id
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId)
    return workspaceId
  }

  // 2+ workspaces: usa o último ativo salvo, se ainda for válido; senão o primeiro (mais antigo)
  const savedId = localStorage.getItem(ACTIVE_WORKSPACE_KEY)
  const validIds = memberships.map((m) => m.workspace_id)
  const workspaceId = (savedId && validIds.includes(savedId))
    ? savedId
    : validIds[0]

  localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId)
  return workspaceId
}