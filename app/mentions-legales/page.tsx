import LegalPage from '@/app/components/LegalPage';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  '/mentions-legales',
  'Mentions légales',
  'Informations sur l’éditeur de NowPay, son hébergement et ses moyens de contact.',
);

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales">
      <section>
        <h2 className="text-xl font-bold">Éditeur</h2>
        <p>
          NowPay est un service édité par{' '}
          <strong>[nom légal de l’éditeur à compléter]</strong>, établi à{' '}
          <strong>[adresse à compléter]</strong>. Forme juridique,
          immatriculation, responsable de publication et adresse de contact :{' '}
          <strong>[à compléter avant publication]</strong>.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Hébergement et prestataires</h2>
        <p>
          Le site est hébergé par Vercel. L’authentification et la base de
          données sont fournies par Supabase. Google fournit le modèle Gemini
          utilisé pour certaines fonctions demandées par le gérant. Les
          coordonnées de contact des prestataires et leurs lieux d’hébergement
          sont à vérifier avant exploitation commerciale.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Contact</h2>
        <p>
          Pour toute question concernant NowPay :{' '}
          <strong>[adresse e-mail de contact de l’éditeur à compléter]</strong>.
        </p>
      </section>
    </LegalPage>
  );
}
