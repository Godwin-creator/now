# NowPay

NowPay est une application web mobile-first qui aide les gérants de PME à suivre
les créances en retard et à préparer des relances adaptées. Le gérant vérifie le
message, puis l'envoie lui-même.

## Stack

- Next.js (App Router), React et TypeScript
- Tailwind CSS v4
- Supabase (Auth et Postgres)
- Gemini via `@google/genai`
- Vitest, ESLint et Prettier

## Installation

Prérequis : Node.js 22 et npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Renseignez les variables nécessaires dans votre environnement local ou sur la
plateforme de déploiement. Ne partagez jamais `.env.local`.

## Variables d'environnement

Les noms de variables sont listés dans [`.env.example`](./.env.example).
`SUPABASE_SERVICE_ROLE_KEY` est réservée au cron et ne doit pas être exposée au
navigateur.

## Scripts

| Commande | Action |
| --- | --- |
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Produit le build de production |
| `npm run start` | Démarre le build de production |
| `npm run typecheck` | Vérifie les types TypeScript |
| `npm run lint` | Lance ESLint |
| `npm test` | Lance les tests Vitest |
| `npm run format` | Formate les fichiers avec Prettier |
| `npm run check` | Lance typecheck, lint et tests |
| `npm run db:types` | Génère les types Supabase du projet CLI lié |

## Supabase

Le guide de [configuration Supabase](./docs/SUPABASE.md) décrit la séparation
dev/prod, les migrations et les réglages Auth. Pour tester les policies RLS avec
pgTAP en local (Docker requis), lancez `npx supabase start`, puis
`npx supabase test db`. N'exécutez les migrations distantes que vers `dev`
après vérification de son project-ref.

## Documentation

Consultez le [document de référence](./docs/REFERENCE.md) pour les décisions,
spécifications et phases du projet. Le [cahier des charges](./docs/CDC.md)
complète ce document.
