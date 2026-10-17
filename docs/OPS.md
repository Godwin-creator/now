# Supabase : configuration P1

## Projets et environnement

Le projet `dev` sert aux migrations, essais RLS et données de test. Le projet
`prod` ne doit pas être lié ni modifié pendant P1. Ne liez la CLI qu'au projet
`dev` après avoir reçu son project-ref.

```sh
npx supabase link --project-ref <DEV_PROJECT_REF>
npx supabase migration list
npx supabase db push
```

Vérifiez le project-ref avant toute commande distante. Les migrations sont
versionnées dans `supabase/migrations/`; ne modifiez pas une migration déjà
appliquée, créez-en une nouvelle. Les données du projet `dev` sont des données
de test et peuvent être supprimées.

Pour démarrer Supabase localement, installer Docker puis lancer
`npx supabase start`. Les tests pgTAP s'exécutent avec
`npx supabase test db`. Cette commande utilise la base locale et ne contacte
pas `dev` ou `prod`.

Le test d'isolation peut aussi être exécuté sur `dev` après avoir vérifié que
la CLI est liée à son project-ref :

```sh
npx supabase test db --linked
```

Pour ce test distant, la CLI a besoin du mot de passe de base de données dans
`SUPABASE_DB_PASSWORD`. Configurez-le uniquement dans l'environnement local
du terminal, ne le transmettez pas dans le chat et ne le commitez pas.

Après application de la migration 0002 sur `dev`, générer les types depuis le
projet lié avec `npm run db:types`. La commande écrit le schéma public dans
`types/database.ts`.

## Réglages Auth dans le dashboard

Dans **Authentication → URL Configuration** :

- **Site URL** : `https://www.nowpay.website` pour `prod`; URL locale
  `http://localhost:3000` en développement.
- **Redirect URLs** : `http://localhost:3000/**`,
  `https://www.nowpay.website/**` et l'URL de preview exacte attribuée au
  projet Vercel de développement (`https://<preview-host>/**`). N'autorisez
  pas de domaines de preview génériques en production.
- Définir `SITE_URL` dans l'environnement de l'application sur l'origine
  correspondante (`http://localhost:3000`, domaine canonique ou preview).
  `/auth/callback` est réservé à l'échange de code OAuth (par exemple Google) ;
  l'inscription e-mail utilise un code à 8 chiffres et ne dépend pas de cette
  route.

Dans **Authentication → Providers → Email** :

- Activer la confirmation de l'adresse e-mail.
- Exiger un mot de passe d'au moins 8 caractères.

Dans **Authentication → Email Templates → Confirm signup**, remplacer le
contenu avec lien par un code visible, par exemple :

```html
<h2>Confirmez votre adresse e-mail</h2>
<p>Votre code de confirmation NowPay est :</p>
<p><strong>{{ .Token }}</strong></p>
```

Supprimer les liens utilisant `{{ .ConfirmationURL }}` ou
`{{ .TokenHash }}` de ce gabarit : l'utilisateur saisit le code dans
`/signup/verify`, vérifié par `auth.verifyOtp({ type: 'signup' })`. L'écran
permet de renvoyer le code avec un délai d'attente de 60 secondes.

L'action `signUp` ne crée aucune ligne dans `companies`. Après authentification,
les utilisateurs sans entreprise sont dirigés vers `/onboarding`. L'action
`createCompany` dérive l'identifiant de `getUser()` et fait un upsert idempotent
sur cet identifiant. La policy `companies_insert_own` reste stricte ; aucun
accès `service_role` n'est utilisé pour l'inscription ou l'onboarding.

Dans **Project Settings → Authentication → SMTP Settings**, saisir les valeurs
fournies par votre prestataire SMTP :

- **Sender email address** : adresse d'envoi vérifiée.
- **Sender name** : `NowPay`.
- **Host** : nom d'hôte SMTP.
- **Port** : port TLS/STARTTLS du prestataire.
- **Username** : identifiant SMTP.
- **Password** : mot de passe ou clé SMTP.

Ne réutilisez pas le mot de passe du compte e-mail. Vérifiez la délivrabilité
des e-mails de confirmation et de réinitialisation avant d'ouvrir les
inscriptions en production.

## Récapitulatif quotidien

L’envoi utilise l’API Resend sans dépendance supplémentaire. Configurez
`RESEND_API_KEY` et `RESEND_FROM_EMAIL` dans chaque environnement Vercel.
L’adresse d’expédition doit appartenir à un domaine vérifié dans Resend. La
valeur `SITE_URL` doit viser l’origine de l’environnement concerné pour que
les liens du message ouvrent son tableau de bord. Les valeurs restent dans le
gestionnaire de variables d’environnement et ne sont jamais ajoutées au dépôt.

`vercel.json` planifie `GET /api/cron/digest` avec `0 7 * * *` en UTC.
Vercel installe les Cron Jobs sur les déploiements de production; les tests
sur `dev`/Preview se font en invoquant la route manuellement avec
`Authorization: Bearer <CRON_SECRET>`. La route compare le secret avant de
créer le client admin. Sur le plan Hobby, Vercel peut exécuter la tâche à
n’importe quelle minute de l’heure planifiée; le passage à 07:00 pile exige
un plan qui garantit la minute.

Le récapitulatif est adressé à l’e-mail de l’entreprise. La préférence
`digest_actif` contrôle l’envoi. Le lien « Désactiver ce récapitulatif » mène
aux paramètres authentifiés où le gérant peut couper l’interrupteur.

## Domaine canonique et Vercel

L’origine canonique de NowPay est `https://www.nowpay.website`. Les pages
publiques déclarent leur URL canonique et leurs métadonnées Open Graph. Le
proxy Next.js redirige en 308 les requêtes reçues sur
`now-one-sigma.vercel.app` vers le même chemin sur le domaine canonique.

Pour que cette redirection s’applique, conserver `now-one-sigma.vercel.app`
comme domaine attaché au même projet Vercel que l’application. Dans **Project
Settings → Domains**, vérifier aussi que `www.nowpay.website` est le domaine
principal. Une redirection de domaine Vercel vers le domaine principal peut
être définie comme règle de plateforme; elle est préférable si le domaine
alias est déplacé vers un autre projet. Vérifier les deux hôtes après chaque
changement de domaine avec une requête HTTP et confirmer le statut 308 et
l’URL de destination.

Le plan d’hébergement doit être vérifié pour l’usage commercial envisagé :
Vercel Hobby est destiné à un usage personnel/non commercial. Voir les
conditions et limites du plan Vercel avant toute exploitation commerciale.

## Suppression de compte

La suppression des données du compte utilise la clé serveur
`SUPABASE_SERVICE_ROLE_KEY` uniquement dans `lib/supabase/admin.ts`. Renseigner
cette variable dans les environnements Preview/Development/Production Vercel
depuis les paramètres du projet, sans préfixe `NEXT_PUBLIC_`. La suppression
de l’utilisateur Auth déclenche les contraintes `ON DELETE CASCADE` de
l’entreprise et de ses clients, factures, paiements, relances et compteurs IA.

Avant de proposer cette action à des utilisateurs, vérifier la cascade sur le
projet Supabase `dev` avec un compte de test jetable et confirmer que le compte
Auth ainsi que toutes ses lignes liées ont disparu. Ne jamais utiliser un
compte ou des données de production pour ce test.
