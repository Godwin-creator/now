import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let adminClient: SupabaseClient<Database> | null = null

export function createAdminClient(): SupabaseClient<Database> {
  if (adminClient) return adminClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) throw new Error('Configuration Supabase admin manquante.')
  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return adminClient
}

export async function deleteAuthUser(userId: string): Promise<{ error: Error | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  return { error: error ? new Error(error.message) : null }
}
