# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# NowPay — conventions pour agents de code

Source de vérité : `docs/REFERENCE.md` (décisions, spécifications, plan). En cas de conflit avec ce fichier, `docs/REFERENCE.md` prévaut. Les consignes de phase sont dans `docs/PROMPTS.md`.

## Produit

NowPay aide un gérant de PME (Lomé, sur téléphone) à relancer ses clients en retard de paiement : quoi dire, quand, sur quel canal. Interface en **français avec accents corrects**. Montants en **FCFA entiers**.

## Stack

Next.js (App Router) · React · TypeScript strict · Tailwind CSS v4 (thème dans `globals.css` via `@theme`, pas de `tailwind.config.ts`) · Supabase (Auth + Postgres + RLS) · Gemini via Vercel AI SDK · Vitest · déploiement Vercel.

## Commandes

- `npm run dev` — développement
- `npm run check` — typecheck + lint + tests. **À exécuter avant de déclarer une tâche terminée.**
- `npm test` — tests unitaires
- `npx supabase db diff` / `npx supabase gen types typescript` — voir `docs/PROMPTS.md` (P1)

## Architecture (règles impératives)

```
app/                 routes, layouts, composants de page (pas de logique métier)
app/actions/         Server Actions MINCES : requireUser → zod → domaine → repo → Result
components/          composants UI réutilisables (client seulement si nécessaire)
lib/domain/          logique métier PURE : scoring, timing, canal, argent, dates. Aucun import de Supabase, React ou Next
lib/db/              accès Supabase (repositories), typés avec types/database.ts
lib/ai/              couche IA : prompts, schémas de sortie, templates de repli, quotas
lib/supabase/        clients server / browser ; admin.ts (service_role) réservé au cron
lib/validation/      schémas zod partagés
types/database.ts    GÉNÉRÉ par la CLI Supabase — ne jamais éditer à la main
supabase/migrations/ migrations versionnées — ne jamais modifier une migration déjà appliquée, en ajouter une nouvelle
```

- Un fichier fait moins de 250 lignes. Au-delà, découper.
- Une règle métier existe **une seule fois** (dans `lib/domain`). Interdit de la recopier dans une action ou un composant.
- Pas de `any`, pas de `// @ts-ignore`, pas de `as` pour contourner un type.

## Sécurité (non négociable)

- Toute Server Action commence par `requireUser()` (basé sur `supabase.auth.getUser()`, jamais `getSession`). Aucune exception, y compris OCR et import.
- Ne jamais faire confiance à un `company_id` ou `user_id` venant du client : le dériver de la session.
- Toute entrée est validée par zod (types, bornes, longueurs). Rejeter, ne pas « corriger silencieusement ».
- `service_role` est interdit hors de `lib/supabase/admin.ts` (marqué `server-only`) et du cron. Jamais dans un composant, une action ou un test d'UI.
- Aucune variable `NEXT_PUBLIC_` contenant un secret. Ne jamais lire, afficher ni committer `.env*`. Documenter les variables dans `.env.example` (sans valeurs).
- Appels IA et OCR : quota (`consume_ai_quota`), timeout, erreurs typées. Jamais de texte généré affiché comme « succès » en cas d'échec : marquer `source = 'template'`.
- Les données personnelles de tiers (nom, téléphone, e-mail d'un débiteur) ne vont dans un prompt que si nécessaire au message.

## Domaine

- Score, niveau, timing et statuts de facture sont **calculés à la lecture**, jamais stockés (voir `docs/REFERENCE.md` §5).
- Dates : colonnes `DATE`, chaînes `YYYY-MM-DD`, calcul en UTC (Lomé = UTC+0, sans heure d'été). Interdit d'utiliser `new Date()` brut dans le domaine : injecter la date du jour en paramètre pour rester testable.
- Un canal n'est proposé que si la coordonnée correspondante existe.
- Messages aux débiteurs : première personne du pluriel (« Nous »), aucun emoji, aucune familiarité injustifiée, au nom de l'entreprise.

## UI

- Mobile-first : concevoir à 390 px de large, puis élargir. Aucun scroll horizontal à 390 px.
- Cibles tactiles ≥ 44 × 44 px. Texte ≥ 14 px (12 px minimum pour les métadonnées). Contraste WCAG AA.
- Tout champ a un `<label htmlFor>`. Tout état a un rendu : chargement, erreur, vide.
- Pas de nouvelle bibliothèque d'animation. Transitions CSS uniquement, `prefers-reduced-motion` respecté.

## Méthode de travail

- Faire **uniquement** ce que la phase demandée décrit. Pas de fonctionnalité V2 (envoi automatique, API WhatsApp, SMS, multilingue).
- Ne pas ajouter de dépendance sans la justifier en une phrase dans la description du changement.
- Écrire les tests en même temps que le code (domaine : tests par tableau de cas ; actions : mocks).
- Petits commits, message à l'impératif en français (« Ajoute le calcul du timing de relance »).
- Si une consigne est ambiguë ou contredit `docs/REFERENCE.md`, s'arrêter et poser la question au lieu de deviner.
