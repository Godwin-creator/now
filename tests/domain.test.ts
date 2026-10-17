import { describe, expect, it } from 'vitest'
import {
  addDays,
  canalEffectif,
  computeScore,
  countRetardsPrecedents,
  daysBetween,
  enrichirCreances,
  formatIsoDate,
  formatFcfa,
  isValidIsoDate,
  parseFcfa,
  recommandationRelance,
  soldeRestant,
  statutFacture,
} from '@/lib/domain'

describe('montants FCFA', () => {
  it.each([
    ['0', 0],
    ['10 000 FCFA', 10_000],
    ['2\u202f000', 2_000],
  ])('analyse %s', (input, expected) => {
    expect(parseFcfa(input)).toBe(expected)
  })

  it.each(['-1', '1.5', 'NaN', '12x', '9007199254740992'])('rejette %s', (input) => {
    expect(parseFcfa(input)).toBeNull()
  })

  it('formate un entier FCFA', () => {
    expect(formatFcfa(10_000)).toBe('10\u202f000 FCFA')
    expect(() => formatFcfa(-1)).toThrow(RangeError)
  })
})

describe('dates UTC', () => {
  it.each([
    ['2026-01-01', '2026-01-01', 0],
    ['2026-01-01', '2026-04-01', 90],
    ['2024-02-28', '2024-03-01', 2],
    ['2026-04-10', '2026-04-01', -9],
  ])('calcule les jours entre %s et %s', (from, to, expected) => {
    expect(daysBetween(from, to)).toBe(expected)
  })

  it.each([
    ['2024-02-28', 1, '2024-02-29'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2026-01-01', -1, '2025-12-31'],
  ])('ajoute %i jour(s) à %s', (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected)
  })

  it.each(['2026-02-28', '2024-02-29'])('accepte la date valide %s', (date) => {
    expect(isValidIsoDate(date)).toBe(true)
  })
  it('affiche une date ISO en français sans décalage de fuseau', () => {
    expect(formatIsoDate('2026-10-17')).toBe('17 octobre 2026')
  })
  it.each(['2026-02-29', '2026-13-01', '16/10/2026', '2026-1-01'])('rejette la date invalide %s', (date) => {
    expect(isValidIsoDate(date)).toBe(false)
  })
  it('rejette les dates et incréments invalides', () => {
    expect(() => daysBetween('nope', '2026-01-01')).toThrow(RangeError)
    expect(() => addDays('2026-01-01', 1.5)).toThrow(RangeError)
    expect(() => addDays('2026-01-01', 100_000_000)).toThrow(RangeError)
  })
})

describe('scoring', () => {
  it.each([
    [{ joursRetard: 4, soldeRestant: 10_000, retardsPrecedents: 0 }, 3],
    [{ joursRetard: 23, soldeRestant: 2_000, retardsPrecedents: 0 }, 11],
    [{ joursRetard: 254, soldeRestant: 3_500, retardsPrecedents: 0 }, 41],
    [{ joursRetard: 0, soldeRestant: 0, retardsPrecedents: 0 }, 0],
    [{ joursRetard: 90, soldeRestant: 0, retardsPrecedents: 0 }, 40],
    [{ joursRetard: 254, soldeRestant: 200_000, retardsPrecedents: 3 }, 100],
    [{ joursRetard: 0, soldeRestant: 50_000, retardsPrecedents: 0, seuilMontantEleve: 100_000 }, 15],
    [{ joursRetard: -2, soldeRestant: -1, retardsPrecedents: -1 }, 0],
  ])('calcule le score %j', (input, expected) => {
    expect(computeScore(input).score).toBe(expected)
  })

  it.each([
    [33, 'Faible', 7, 0, 3],
    [34, 'Moyen', 9, 0, 3],
    [66, 'Moyen', 81, 0, 3],
    [67, 'Élevé', 90, 46_667, 2],
    [85, 'Élevé', 90, 100_000, 3],
    [86, 'Critique', 90, 106_667, 3],
  ] as const)('classe le score %i', (score, niveau, joursRetard, soldeRestant, retardsPrecedents) => {
    expect(computeScore({ joursRetard, soldeRestant, retardsPrecedents })).toEqual({ score, niveau })
  })
  it('refuse un seuil nul et les valeurs non finies', () => {
    expect(() => computeScore({ joursRetard: 1, soldeRestant: 1, retardsPrecedents: 0, seuilMontantEleve: 0 })).toThrow(RangeError)
    expect(() => computeScore({ joursRetard: Number.NaN, soldeRestant: 1, retardsPrecedents: 0 })).toThrow(RangeError)
  })
})

describe('factures et récidive', () => {
  it.each([
    [10_000, [], 10_000, 'en_attente'],
    [10_000, [3_000], 7_000, 'partielle'],
    [10_000, [10_000], 0, 'payee'],
    [10_000, [12_000], 0, 'payee'],
  ] as const)('calcule solde et statut', (amount, payments, balance, status) => {
    expect(soldeRestant(amount, payments)).toBe(balance)
    expect(statutFacture(amount, payments)).toBe(status)
  })
  it('conserve le statut annulé et refuse les montants invalides', () => {
    expect(statutFacture(10_000, [], true)).toBe('annulee')
    expect(() => soldeRestant(10_000, [-1])).toThrow(RangeError)
  })
  it('compte uniquement les factures réglées après échéance', () => {
    expect(countRetardsPrecedents([
      { date_echeance: '2026-01-10', date_reglement: '2026-01-11' },
      { date_echeance: '2026-01-10', date_reglement: '2026-01-10' },
      { date_echeance: 'invalid', date_reglement: '2026-01-11' },
    ])).toBe(1)
  })
})

describe('timing des relances', () => {
  it.each([
    ['Faible', '2026-01-06', false, 7],
    ['Faible', '2026-01-08', true, 7],
    ['Moyen', '2026-01-01', false, 1],
    ['Moyen', '2026-01-05', true, 1],
    ['Élevé', '2026-01-04', true, 1],
    ['Critique', '2026-01-03', true, 1],
  ] as const)('applique la cadence %s', (niveau, today, attendu, premierRappel) => {
    expect(recommandationRelance({ dateEcheance: '2026-01-01', today, niveau, statut: 'en_attente' })).toMatchObject({
      aRelancerAujourdhui: attendu,
      prochaineRelanceLe: addDays('2026-01-01', premierRappel),
    })
  })
  it('respecte la cadence entre relances envoyées et recommande l’appel à 46 jours', () => {
    expect(recommandationRelance({
      dateEcheance: '2026-01-01', today: '2026-01-08', niveau: 'Moyen', statut: 'en_attente', derniereRelanceEnvoyee: '2026-01-04',
    }).aRelancerAujourdhui).toBe(true)
    expect(recommandationRelance({ dateEcheance: '2026-01-01', today: '2026-02-16', niveau: 'Moyen', statut: 'en_attente' }).appelRecommande).toBe(true)
    expect(recommandationRelance({
      dateEcheance: '2026-01-01', today: '2026-01-01', niveau: 'Moyen', statut: 'en_attente', derniereRelanceEnvoyee: '2025-12-28',
    })).toMatchObject({ aRelancerAujourdhui: false, prochaineRelanceLe: '2026-01-02' })
    expect(recommandationRelance({ dateEcheance: '2026-01-01', today: '2026-01-01', niveau: 'Critique', statut: 'payee' })).toMatchObject({
      aRelancerAujourdhui: false,
      prochaineRelanceLe: null,
      appelRecommande: true,
    })
  })
  it('rejette une date de relance invalide', () => {
    expect(() => recommandationRelance({
      dateEcheance: '2026-01-01', today: '2026-01-02', niveau: 'Moyen', statut: 'en_attente', derniereRelanceEnvoyee: 'bad',
    })).toThrow(RangeError)
    expect(() => recommandationRelance({
      dateEcheance: 'invalid', today: '2026-01-02', niveau: 'Moyen', statut: 'en_attente',
    })).toThrow(RangeError)
    expect(() => recommandationRelance({
      dateEcheance: '2026-01-01', today: '2026-01-02', niveau: 'inconnu', statut: 'en_attente',
    })).toThrow(RangeError)
  })
})

describe('canal effectif', () => {
  it('garde le canal choisi lorsque sa coordonnée existe', () => {
    expect(canalEffectif('whatsapp', { whatsapp: '+22890000000' })).toEqual({ canal: 'whatsapp', raison: 'choisi' })
  })
  it.each([
    ['whatsapp', { telephone: '+22890000000' }, 'sms'],
    ['email', { whatsapp: '+22890000000' }, 'whatsapp'],
    ['sms', { email: 'client@example.com' }, 'email'],
    ['tous', { telephone: '+22890000000' }, 'sms'],
  ] as const)('propose un repli pour %s', (selected, coords, canal) => {
    expect(canalEffectif(selected, coords)).toEqual({ canal, raison: 'canal de repli' })
  })
  it('signale l’absence de coordonnée disponible', () => {
    expect(canalEffectif('whatsapp', {})).toEqual({ canal: null, raison: 'coordonnée manquante' })
  })
})

describe('enrichissement des créances', () => {
  it('dérive score, statut, récidive, timing et canal sans relance non envoyée', () => {
    const enriched = enrichirCreances([
      {
        id: 'old', client_id: 'client-1', date_echeance: '2026-01-01', montant_fcfa: 1_000,
        statut: 'payee', canal_contact: 'whatsapp', clients: { telephone: '90000000' },
        paiements: [{ montant_paye: 1_000, date_paiement: '2026-01-03' }],
      },
      {
        id: 'current', client_id: 'client-1', date_echeance: '2026-01-02', montant_fcfa: 10_000,
        statut: 'en_attente', canal_contact: 'ancien', clients: { telephone: '90000000' },
        paiements: [{ montant_paye: 2_000, date_paiement: '2026-01-02' }, { montant_paye: 500, date_paiement: null }],
        relances: [
          { statut_envoi: 'generee', envoyee_at: null, created_at: '2026-01-08T12:00:00Z' },
          { statut_envoi: 'envoyee', envoyee_at: null, created_at: '2026-01-05T12:00:00Z' },
        ],
      },
    ], '2026-01-12', 200_000)

    expect(enriched[1]).toMatchObject({
      solde_restant: 7_500,
      statut_calcule: 'partielle',
      score: 16,
      niveau: 'Faible',
      canal_effectif: 'sms',
      jours_retard: 10,
      recommandation: { aRelancerAujourdhui: true, prochaineRelanceLe: '2026-01-12' },
    })
  })

  it('gère solde nul, annulation, aucune coordonnée, relance à venir et date invalide', () => {
    const [paid, canceled] = enrichirCreances([
      {
        id: 'paid', client_id: 'a', date_echeance: '2026-01-01', montant_fcfa: 1_000,
        statut: 'en_attente', canal_contact: 'email', paiements: [{ montant_paye: 1_000, date_paiement: '2026-01-01' }],
      },
      {
        id: 'canceled', client_id: 'b', date_echeance: '2026-01-01', montant_fcfa: 1_000,
        statut: 'annulee', canal_contact: 'sms',
        relances: [{ statut_envoi: 'copiee', envoyee_at: null, created_at: '2026-01-01T00:00:00Z' }],
      },
    ], '2026-01-02')

    expect(paid).toMatchObject({ solde_restant: 0, statut_calcule: 'payee', canal_effectif: null })
    expect(canceled).toMatchObject({ statut_calcule: 'annulee', recommandation: { aRelancerAujourdhui: false } })
    expect(() => enrichirCreances([], 'invalid')).toThrow(RangeError)
  })
})
