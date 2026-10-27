import { landingInvoices, landingReminderMessage } from '@/lib/demo/landing-data'
import DashboardTodayCard from '@/app/components/DashboardTodayCard'

const label = 'Aperçu de l’écran “À faire aujourd’hui” de NowPay : trois factures à relancer, triées par priorité'

function PhoneScreen({ second = false }: { second?: boolean }) {
  return (
    <div className={`phone-frame ${second ? 'phone-frame-secondary' : 'phone-frame-primary'}`}>
      <div className="phone-island" aria-hidden="true" />
      {second ? (
        <div className="phone-screen phone-message-screen">
          <div className="phone-appbar"><span>←</span><span>Préparer une relance</span><span>•••</span></div>
          <p className="phone-eyebrow">MESSAGE À RELIRE</p>
          <h3>Rappel de règlement</h3>
          <p className="phone-message">{landingReminderMessage}</p>
          <div className="phone-channel">Canal proposé <strong>WhatsApp</strong></div>
          <div className="phone-send">Ouvrir WhatsApp</div>
          <p className="phone-manual">Vous relisez puis envoyez le message vous-même.</p>
        </div>
      ) : (
        <div className="phone-screen" data-testid="phone-screen">
          <div className="phone-appbar"><strong>NowPay</strong><span>☰</span></div>
          <h3 className="phone-today-title">À faire aujourd’hui</h3>
          <p className="phone-summary">3 factures à relancer</p>
          {landingInvoices.map((invoice) => <DashboardTodayCard key={invoice.id} invoice={invoice} />)}
        </div>
      )}
    </div>
  )
}

export default function PhoneMockup() {
  return (
    <div className="phone-mockup" role="img" aria-label={label}>
      <div className="phone-stack" inert aria-hidden="true">
        <PhoneScreen second />
        <PhoneScreen />
      </div>
    </div>
  )
}
