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
