import { supabase } from './supabase'

export async function ensureWorkspaceForUser() {
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return null

  const userId = userData.user.id

  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .single()

  if (error || !membership) {
    console.error('Usuário não pertence a nenhum workspace')
    return null
  }

  return membership.workspace_id
}