import { formatFcfa } from '@/lib/domain'

export interface DigestItem {
  clientName: string
  balance: number
  daysLate: number
  riskLevel: string
}

export interface OutgoingEmail {
  to: string
  subject: string
  text: string
  html: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }
    return entities[character] ?? character
  })
}

export function buildDailyDigestEmail(
  items: readonly DigestItem[],
  siteUrl: string,
): Omit<OutgoingEmail, 'to'> {
  const settingsUrl = new URL('/dashboard/parametres#digest-preference', siteUrl).toString()
  const rows = items.map((item) => ({
    ...item,
    balanceText: formatFcfa(item.balance),
  }))
  const count = rows.length
  const textItems = rows.map((item) =>
    `• ${item.clientName} — solde ${item.balanceText} — ${item.daysLate} jours de retard — niveau ${item.riskLevel}`,
  )
  const htmlItems = rows.map((item) =>
    `<li><strong>${escapeHtml(item.clientName)}</strong> — solde ${escapeHtml(item.balanceText)} — ${item.daysLate} jours de retard — niveau ${escapeHtml(item.riskLevel)}</li>`,
  )
  const headline = `Aujourd'hui : ${count} relances à faire`
  const dashboardUrl = new URL('/dashboard', siteUrl).toString()

  return {
    subject: 'NowPay — récapitulatif quotidien',
    text: [headline, '', ...textItems, '', `Ouvrir NowPay : ${dashboardUrl}`, '', `Désactiver ce récapitulatif : ${settingsUrl}`].join('\n'),
    html: `<main><h1>${headline}</h1><ul>${htmlItems.join('')}</ul><p><a href="${escapeHtml(dashboardUrl)}">Ouvrir NowPay</a></p><p><a href="${escapeHtml(settingsUrl)}">Désactiver ce récapitulatif</a></p></main>`,
  }
}

export async function sendEmail(message: OutgoingEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) throw new Error('Configuration e-mail manquante.')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Échec de l’envoi e-mail (${response.status}).`)
}
