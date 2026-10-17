import LegalPage from '@/app/components/LegalPage';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  '/confidentialite',
  'Politique de confidentialité',
  'Données traitées par NowPay, usages, conservation et droits des personnes.',
);

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité">
      <section>
        <h2 className="text-xl font-bold">Responsable et données traitées</h2>
        <p>
          Le responsable du traitement est l’éditeur de NowPay, dont les
          coordonnées légales restent à compléter. NowPay traite les données du
          compte du gérant (adresse e-mail et informations de l’entreprise
          saisies à l’inscription) ainsi que les coordonnées des débiteurs et
          les informations de factures, paiements et relances que le gérant
          saisit ou importe : noms, e-mails, numéros de téléphone et données de
          suivi.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Finalités</h2>
        <p>
          Ces données servent à fournir le compte, organiser le suivi des
          créances, calculer les priorités, préparer à la demande du gérant des
          messages de relance, enregistrer ses actions, exporter ses créances et
          assurer la sécurité et le fonctionnement du service. Les messages sont
          contrôlés par le gérant, qui les envoie lui-même aux débiteurs.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Sous-traitants</h2>
        <p>
          NowPay s’appuie sur Supabase pour l’authentification et la base de
          données, Vercel pour l’hébergement de l’application et Google Gemini
          pour les fonctions d’intelligence artificielle demandées par le
          gérant. Selon la fonction utilisée, les informations nécessaires
          peuvent être transmises au prestataire concerné. Les lieux de
          traitement, transferts internationaux, contrats et paramètres de
          conservation des journaux et sauvegardes doivent être confirmés avant
          ouverture commerciale.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Conservation et suppression</h2>
        <p>
          Les données du compte et de l’entreprise sont conservées pendant
          l’utilisation du service. Le gérant peut exporter ses créances et
          demander la suppression de son compte ; cette action supprime le
          compte de l’entreprise et les données qui en dépendent. Les durées
          applicables aux journaux techniques et sauvegardes des prestataires
          sont à compléter après vérification de leurs réglages et contrats.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Vos droits et contact</h2>
        <p>
          Le gérant peut demander l’accès, la rectification ou l’effacement des
          données personnelles le concernant, et exercer les autres droits
          prévus par la réglementation applicable. Il peut aussi contacter
          l’éditeur à <strong>[adresse e-mail de contact à compléter]</strong>.
          Les personnes dont les coordonnées ont été saisies par un gérant
          peuvent adresser leurs demandes au responsable du traitement via ce
          contact, à compléter avant publication. En cas de difficulté, elles
          peuvent saisir l’autorité togolaise compétente en matière de
          protection des données personnelles, l’IPDCP.
        </p>
      </section>
    </LegalPage>
  );
}
