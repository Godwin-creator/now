export type CanalContact = 'whatsapp' | 'email' | 'sms' | 'tel' | 'tous'
export type CanalEffectif = Exclude<CanalContact, 'tous'> | null

export interface CoordonneesCanal {
  whatsapp?: string | null
  telephone?: string | null
  email?: string | null
}

export interface CanalEffectifResult {
  canal: CanalEffectif
  raison: 'choisi' | 'canal de repli' | 'coordonnée manquante'
}

export function canalEffectif(canalChoisi: string, coordonnees: CoordonneesCanal): CanalEffectifResult {
  const disponible: Record<Exclude<CanalContact, 'tous'>, boolean> = {
    whatsapp: Boolean(coordonnees.whatsapp?.trim()),
    email: Boolean(coordonnees.email?.trim()),
    sms: Boolean(coordonnees.telephone?.trim()),
    tel: Boolean(coordonnees.telephone?.trim()),
  }
  const canalDemande = (['whatsapp', 'email', 'sms', 'tel'] as const).find((canal) => canal === canalChoisi)
  if (canalDemande && disponible[canalDemande]) {
    return { canal: canalDemande, raison: 'choisi' }
  }

  const fallback = (['whatsapp', 'email', 'sms', 'tel'] as const).find((canal) => disponible[canal])
  return fallback
    ? { canal: fallback, raison: 'canal de repli' }
    : { canal: null, raison: 'coordonnée manquante' }
}