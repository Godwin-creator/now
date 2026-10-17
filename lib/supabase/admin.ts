import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function deleteAuthUser(userId: string): Promise<{ error: Error | null }> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  )
  const { error } = await supabase.auth.admin.deleteUser(userId)
  return { error: error ? new Error(error.message) : null }
}
