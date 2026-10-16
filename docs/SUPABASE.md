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

Dans **Authentication → Providers → Email** :

- Activer la confirmation de l'adresse e-mail.
- Exiger un mot de passe d'au moins 8 caractères.

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
