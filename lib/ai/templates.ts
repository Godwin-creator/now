import { formatFcfa } from '@/lib/domain/money'
import type { NiveauTemplate, RelanceInput, RelanceOutput } from './contracts'

const niveaux: Record<NiveauTemplate, string> = {
  Faible: 'Nous souhaitons vous rappeler avec courtoisie',
  Moyen: 'Nous vous contactons au sujet du règlement attendu',
  'Élevé': 'Nous attirons votre attention sur le retard de règlement',
  Critique: 'Nous vous demandons de régulariser cette situation sans délai',
}

const tons: Record<RelanceInput['ton'], string> = {
  courtois: 'Nous restons disponibles pour convenir ensemble d’une date de règlement.',
  factuel: 'Nous vous remercions de nous confirmer la date prévue de règlement.',
  ferme: 'Nous vous remercions de procéder au règlement ou de nous contacter rapidement.',
  urgent: 'Nous vous prions de nous contacter sans délai afin de convenir d’une régularisation.',
}

export function buildTemplate(
  input: RelanceInput,
  niveau: NiveauTemplate,
): RelanceOutput {
  const montant = formatFcfa(input.montantSolde)
  const numero = input.numeroFacture ? ` (facture ${input.numeroFacture})` : ''
  const reference = ` la facture${numero} de ${montant}, échue le ${input.dateEcheance}`
  const opening = `${niveaux[niveau]}${reference}.`
  const closing = tons[input.ton]

  if (input.canal === 'email') {
    return {
      objet: `Rappel de règlement${input.numeroFacture ? ` - ${input.numeroFacture}` : ''}`,
      corps: `Madame, Monsieur,\n\n${opening}\n\n${closing}\n\nCordialement,\n${input.entreprise}`,
    }
  }

  if (input.canal === 'tel') {
    return {
      corps: `Ouverture : Bonjour ${input.client}, nous vous appelons au nom de ${input.entreprise}.\n\nRappel : ${opening}\n\nÉchange : ${closing}\n\nClôture : Nous vous remercions pour votre attention.`,
    }
  }

  if (input.canal === 'sms') {
    return { corps: `${input.entreprise} : Nous vous rappelons le règlement de ${montant}. ${closing}` }
  }

  return {
    corps: `Bonjour ${input.client}, ${opening} Nous vous écrivons au nom de ${input.entreprise}. ${closing}`,
  }
}