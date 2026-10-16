import { failure, success, type Result } from '@/lib/auth/result'
import { createClient } from '@/utils/supabase/server'

export async function consumeAiQuota(
  kind: string,
  maxPerHour: number,
  maxPerDay: number,
): Promise<Result<null>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('consume_ai_quota', {
      p_kind: kind,
      p_max_heure: maxPerHour,
      p_max_jour: maxPerDay,
    })
    if (error) return failure('QUOTA_UNAVAILABLE', 'Le contrôle du quota IA est temporairement indisponible.')
    if (!data) return failure('quota', 'La limite d’utilisation quotidienne est atteinte. Réessayez demain.')
    return success(null)
  } catch {
    return failure('QUOTA_UNAVAILABLE', 'Le contrôle du quota IA est temporairement indisponible.')
  }
}