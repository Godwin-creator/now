import type { Metadata } from 'next'
import AccountSettings from './AccountSettings'
import { requireCompany } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export const metadata: Metadata = {
  title: 'Paramètres',
  robots: { index: false, follow: false },
}

export default async function ParametresPage() {
  const { user } = await requireCompany()
  const supabase = await createClient()
  const { data: company, error } = await supabase.from('companies').select('nom, email, digest_actif').eq('id', user.id).single()
  if (error || !company) throw new Error('Impossible de charger les paramètres du compte.')
  return <AccountSettings companyName={company.nom} digestActive={company.digest_actif} hasDigestEmail={Boolean(company.email)} />
}
