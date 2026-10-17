import LegalPage from '@/app/components/LegalPage';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  '/cgu',
  'Conditions d’utilisation',
  'Conditions d’utilisation du service de suivi et de relance NowPay.',
);

export default function ConditionsUtilisationPage() {
  return (
    <LegalPage title="Conditions d’utilisation">
      <section>
        <h2 className="text-xl font-bold">Service</h2>
        <p>
          NowPay aide le gérant à suivre ses créances, à décider quand relancer
          et à préparer un message. Les suggestions sont une aide à la gestion
          et ne garantissent ni paiement ni résultat de recouvrement. Le gérant
          relit chaque message et l’envoie lui-même depuis le canal choisi.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Compte et données saisies</h2>
        <p>
          Le gérant est responsable de la confidentialité de ses accès, de
          l’exactitude des informations saisies et de l’usage qu’il en fait. Il
          confirme disposer du droit et d’une base légale pour saisir et
          utiliser les coordonnées de ses clients et débiteurs, et s’engage à
          respecter leurs droits ainsi que la réglementation applicable.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Utilisation acceptable</h2>
        <p>
          Le gérant vérifie le destinataire et le contenu avant tout envoi, et
          s’abstient de messages illicites, trompeurs ou excessifs. NowPay ne
          transmet aucun message sans l’action du gérant. Le gérant peut
          exporter ses créances et demander la suppression de son compte depuis
          les paramètres.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Éditeur et contact</h2>
        <p>
          Éditeur : <strong>[nom légal et adresse à compléter]</strong>. Contact
          : <strong>[adresse e-mail à compléter]</strong>. Ces conditions sont
          un document de travail à faire relire par un juriste avant
          exploitation commerciale.
        </p>
      </section>
    </LegalPage>
  );
}
