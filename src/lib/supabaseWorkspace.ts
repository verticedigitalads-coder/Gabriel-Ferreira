import { supabase } from './supabase'

export async function ensureWorkspaceForUser() {
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return null

  const userId = userData.user.id

  // Buscar memberships
  const { data: memberships, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)

  if (error) {
    console.error('Erro ao buscar membership:', error)
    return null
  }

  // Se já pertence a workspace, retorna o primeiro
  if (memberships && memberships.length > 0) {
    return memberships[0].workspace_id
  }

  // Criar novo workspace
  const { data: newWorkspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert([
      {
        nome: 'Workspace Principal',
        owner_id: userId,
      },
    ])
    .select()
    .single()

  if (workspaceError || !newWorkspace) {
    console.error('Erro ao criar workspace:', workspaceError)
    return null
  }

  // Criar membership admin
  const { error: membershipError } = await supabase
    .from('workspace_members')
    .insert([
      {
        workspace_id: newWorkspace.id,
        user_id: userId,
        role: 'admin',
      },
    ])

  if (membershipError) {
    console.error('Erro ao criar membership:', membershipError)
    return null
  }

  return newWorkspace.id
}