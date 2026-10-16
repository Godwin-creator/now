# NowPay — Prompts d'exécution par phase

Mode d'emploi :
1. Un seul agent écrit dans le dépôt à la fois. Une branche par phase (`git switch -c p0-fondations`).
2. Coller le prompt de la phase dans Cursor (mode agent) ou Copilot (mode agent).
3. Relire le diff **avant** de merger. Lancer `npm run check`. Tester la preview Vercel.
4. Merger sur `main` seulement si tout est vert. Passer à la phase suivante dans une nouvelle conversation (contexte propre).

Chaque prompt commence par le même préambule : ne pas le retirer.

```
Contexte : lis d'abord AGENTS.md puis docs/REFERENCE.md (sections citées plus bas).
Travaille uniquement sur la phase décrite. N'ajoute aucune fonctionnalité hors phase.
Avant de terminer : exécute `npm run check`, corrige jusqu'au vert, puis résume
en 10 lignes maximum ce qui a changé, les fichiers créés / supprimés, et les
points que je dois vérifier manuellement. Si une consigne est ambiguë, arrête-toi et pose la question.
```

---

## P0 — Fondations

```
[Préambule] Phase P0 — Fondations. Références : REFERENCE.md §3 (SEC-01, ARCH-03, ARCH-05, ARCH-07, OPS-01) et §6 (P0).

Tâches :
1. Mets à jour `next` et `eslint-config-next` vers la dernière version patch sûre (≥ 16.4.2).
   Lance `npm audit` puis `npm audit fix` SANS `--force`. Liste ce qu'il reste. Ne rétrograde aucune
   dépendance majeure.
2. Crée `.env.example` listant toutes les variables lues dans le code (NEXT_PUBLIC_SUPABASE_URL,
   NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY, GEMINI_MODEL, CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY
   [commentaire : réservé au cron], SITE_URL) sans valeurs. Ne lis jamais `.env.local`.
3. Réécris `README.md` : description, stack, installation, variables, scripts, lien vers docs/REFERENCE.md.
4. Déplace `Now - Cahier des charges.md` vers `docs/CDC.md` et supprime l'image base64 intégrée
   (remplace-la par une mention « logo : public/logo-nowpay.png »).
5. Ajoute le middleware d'authentification (convention Next de cette version : vérifie dans
   node_modules/next/dist/docs/ le nom exact du fichier). Il rafraîchit la session Supabase (@supabase/ssr)
   et redirige `/dashboard/*` vers `/login` si `getUser()` échoue. Ajoute `requireUser()` dans
   `lib/auth.ts` (basé sur getUser) et utilise-le dans `app/dashboard/layout.tsx`.
6. Tailwind v4 : migre les couleurs et tokens de `tailwind.config.ts` vers un bloc `@theme` dans
   `app/globals.css`, supprime `tailwind.config.ts`, et vérifie visuellement (build) que les classes
   `now-*` existent toujours.
7. Outillage : Vitest (+ un test d'exemple trivial), Prettier, scripts `typecheck` (tsc --noEmit),
   `test`, `format` et `check` = typecheck + lint + test. TypeScript `strict` et `noUncheckedIndexedAccess`.
8. CI : `.github/workflows/ci.yml` — sur push et PR : npm ci, check, build, `npm audit --audit-level=high`
   (non bloquant au début, mais affiché).
9. Supprime `app/components/AnimatedSection.tsx` (code mort, aucun import).

Critères : `npm run check` vert ; build OK ; `/dashboard` sans session redirige vers `/login`.
```

## P1 — Supabase : environnements, migrations, RLS

```
[Préambule] Phase P1 — Supabase. Références : REFERENCE.md §3 (SEC-04, SEC-05, SEC-06, SEC-08, DATA-01 à DATA-04, DATA-06), §5.3 et §6 (P1).

Important : je dispose de deux projets Supabase, `dev` et `prod` (je les crée moi-même et je te donne
les project-ref). Travaille d'abord UNIQUEMENT contre `dev`. Les données actuelles sont des tests,
supprimables.

Tâches :
1. `npx supabase init`, versionne `supabase/config.toml`. Crée `supabase/migrations/`.
2. Migration 0001 = schéma de référence repris de `supabase/schema.sql` (ancien fichier supprimé
   ensuite). Migration 0002 = évolutions de REFERENCE.md §5.3, en entier :
   - montants BIGINT ; dates en DATE ; `numero` de facture généré et unique par entreprise ;
   - suppression de `score_risque` et `niveau_risque` ;
   - statut de facture ∈ en_attente | partielle | payee | annulee ;
   - relances : `statut_envoi` ∈ generee | copiee | envoyee (défaut generee), `source`, `envoyee_at` ;
   - companies : `seuil_montant_eleve`, `digest_actif` ;
   - contrainte d'isolation : clé composite (id, company_id) sur clients et FK composite depuis factures ;
     même garantie pour relances/paiements via la facture ;
   - table `ai_usage` + fonction `consume_ai_quota(kind text, max_heure int, max_jour int) returns boolean`
     (security definer, search_path fixé, utilise auth.uid()) ;
   - policies : supprime les `FOR ALL`, crée SELECT / INSERT / UPDATE / DELETE avec WITH CHECK ;
     ajoute DELETE sur companies ; index listés en §5.3.
3. Écris `supabase/tests/rls.test.sql` (pgTAP) ou, à défaut, `scripts/rls-check.ts` : deux utilisateurs A et B ;
   vérifie que A ne peut ni lire, ni modifier, ni supprimer, ni **référencer** (client_id, facture_id)
   une ligne de B. Documente comment l'exécuter dans README.
4. Génère `types/database.ts` avec `npx supabase gen types typescript` et ajoute le script
   `npm run db:types`. Remplace progressivement `types/index.ts` par des types dérivés (sans casser le build :
   adapte uniquement les imports nécessaires).
5. Ne modifie PAS encore la logique des Server Actions au-delà de ce qui est nécessaire pour compiler
   (la refonte arrive en P2/P3). Si une action écrit encore score_risque, retire ce champ de l'écriture.
6. Documente dans docs/SUPABASE.md : projets dev/prod, procédure de migration (`supabase db push`),
   et les réglages Auth à faire dans le dashboard (confirmation e-mail activée, mot de passe ≥ 8
   caractères, URLs de redirection, SMTP personnalisé : liste exacte des champs à remplir).

Critères : le test d'isolation passe ; `npm run check` vert ; aucune migration existante modifiée après coup.
```

## P2 — Domaine pur

```
[Préambule] Phase P2 — Domaine. Références : REFERENCE.md §3 (DOM-01, DOM-02, DOM-03, DATA-05, DATA-07, ARCH-01) et §5.1 / §5.2.

Crée `lib/domain/` — fonctions PURES, sans import de Supabase, React ni Next, sans accès à l'horloge
(la date du jour est un paramètre `today: string` au format YYYY-MM-DD) :
- `money.ts` : `formatFcfa(n)`, `parseFcfa(input)` (entiers uniquement, rejet des valeurs négatives ou NaN).
- `dates.ts` : `daysBetween(a, b)`, `addDays`, `isValidIsoDate` — calcul en UTC sur chaînes.
- `scoring.ts` : implémente EXACTEMENT la formule de REFERENCE.md §5.1 (retard plafonné à 90 j,
  montant relatif au seuil de l'entreprise, récidive plafonnée à 30). Exporte `computeScore(input)` → {score, niveau}.
- `recidive.ts` : `countRetardsPrecedents(facturesSoldeesDuClient)`.
- `facture.ts` : `soldeRestant`, `statutFacture` dérivés des paiements.
- `timing.ts` : `recommandationRelance(...)` → { aRelancerAujourdhui, prochaineRelanceLe, appelRecommande }
  selon le tableau de §5.2.
- `canal.ts` : `canalEffectif(canalChoisi, coordonnees)` → { canal, raison } (jamais un canal sans coordonnée).
- `index.ts` : exports.

Remplace TOUTES les copies de la logique (`app/actions/creances.ts`, `app/actions/importCsv.ts`,
`DashboardClient.tsx`) par des appels à ce module. Supprime le +15 et le `montant_max` codé en dur.
Le score n'est plus écrit en base : calcule-le à la lecture dans une fonction `enrichirCreances(rows, today, seuil)`
dans `lib/db/` ou `lib/domain/`.

Tests Vitest par tableau de cas, dont : 0 jour de retard ; exactement 90 j ; 254 j (plafond) ; solde = 0 ;
paiement partiel ; seuil personnalisé ; limites de niveaux (33/34, 66/67, 85/86) ; cadence par niveau ;
appel recommandé à 46 j ; canal sans coordonnée ; dates invalides.
Reproduis les cas de la capture réelle : (4 j, 10 000 FCFA), (23 j, 2 000 FCFA), (254 j, 3 500 FCFA)
et documente les scores attendus dans les tests.

Critères : couverture ≥ 90 % sur lib/domain ; aucune duplication de règle ; `npm run check` vert.
```

## P3 — Server Actions, IA, robustesse

```
[Préambule] Phase P3 — Actions et IA. Références : REFERENCE.md §3 (SEC-02, SEC-03, SEC-07, ARCH-02, ARCH-04, DOM-04, DOM-05, IA-01 à IA-04, OPS-02), §5.4 et §6 (P3).

1. Structure : chaque Server Action suit `requireUser → parse zod → domaine → repo (lib/db) → Result<T>`
   avec `type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }`.
   Aucune action ne renvoie de message d'erreur technique brut à l'UI. Schémas zod dans `lib/validation/`.
2. `ocr.ts` : ajoute `requireUser`, quota `consume_ai_quota('ocr', ...)`, limite de taille et de type MIME
   du fichier, validation zod du JSON extrait, timeout 15 s.
3. `importCsv.ts` : limite de lignes (500) et de taille, rejet des lignes invalides avec rapport par ligne
   (jamais de « date invalide = aujourd'hui »).
4. `lib/ai/` : installe `ai` et `@ai-sdk/google` (lis la documentation de la version installée pour la
   génération de sortie structurée : l'API exacte varie selon les versions). Implémente le contrat de
   REFERENCE.md §5.4 : entrée bornée et délimitée, sortie validée `{ objet?, corps }`, contrôles
   déterministes (pas d'emoji, « Nous », montant + nom de l'entreprise présents, SMS ≤ 320 caractères),
   repli sur `lib/ai/templates.ts` (templates par niveau × canal × ton, rédigés en français soigné),
   timeout 15 s, erreurs typées. Modèle depuis `GEMINI_MODEL`. Aucune clé dans le client.
5. Relances : `genererRelance` crée une relance `generee` ; ajoute `marquerRelanceEnvoyee(relanceId)`
   (→ `envoyee`, `envoyee_at`) et `marquerRelanceCopiee`. L'historique affiche le statut réel.
6. Paiements : `enregistrerPaiement(factureId, montant, date)` (partiel ou total, montant > 0, ≤ solde,
   vérifie qu'une ligne a bien été écrite). Remplace `marquerCommePayee`. Le statut de facture reste dérivé.
7. Clients : `updateClient` persistant (zod, RLS), + détection de doublon (même nom normalisé dans
   l'entreprise) à la création.
8. Auth : une seule Server Action `signUpWithCompany` utilisée par `/signup` ET `/login` ; supprime la
   duplication côté client.
9. Robustesse : `app/error.tsx`, `app/global-error.tsx`, `app/dashboard/loading.tsx`.
10. Découpe les fichiers > 300 lignes touchés par cette phase.

Tests : actions avec mocks (non authentifié refusé, quota dépassé, entrée invalide, Gemini en erreur →
template étiqueté `source: 'template'`, paiement supérieur au solde refusé).

Critères : aucune action sans requireUser ; OCR/IA refusent anonyme et dépassement de quota ;
`npm run check` vert.
```

## P4 — UX mobile

```
[Préambule] Phase P4 — UX mobile. Références : REFERENCE.md §3 (UX-01 à UX-08, DOM-06, ARCH-06), §4.1 et §6 (P4). Conçois à 390 px de large d'abord.

1. Accueil `/dashboard` = **file « À faire aujourd'hui »** : cartes triées par score décroissant, uniquement
   les créances avec `aRelancerAujourdhui` (via lib/domain/timing). Chaque carte : client, solde en FCFA,
   jours de retard, badge de niveau (couleur + texte, pas seulement la couleur), canal effectif, et un
   bouton principal « Relancer par WhatsApp / e-mail / SMS » (ou « Appeler » si appel recommandé) de 48 px de haut.
   KPI en haut : créances actives, solde total dû, en retard, à relancer aujourd'hui (valeur réelle, plus un doublon de « en retard »).
   Lien vers « Toutes les créances ».
2. « Toutes les créances » : cartes sur mobile, tableau à partir de `md`. Filtres complets du CDC :
   statut, niveau de risque, jours de retard (tranches), canal, recherche par nom. Tri par priorité par défaut.
   Panneau de filtres repliable sur mobile.
3. Relance : l'écran de génération est visible directement (plus d'accordéon fermé). Étapes : message
   généré → éditable → « Ouvrir WhatsApp / Mail / SMS » (deep link pré-rempli) → bouton « J'ai envoyé » qui
   appelle marquerRelanceEnvoyee. Affiche un badge « Message de secours » si `source = 'template'`.
   Si la coordonnée du canal manque : message clair et proposition d'un autre canal ou d'ajouter la coordonnée.
4. Formulaire nouvelle créance : 6 champs visibles (client avec saisie semi-automatique des clients
   existants, montant, date du service, relation, profil, canal). Champs avancés repliés (e-mail, secteur,
   retards, délai de paiement). Raccourcis de montant ≥ 44 px. OCR et import CSV dans un menu « Autres façons d'ajouter ».
5. Paiement : bouton « Payé » ouvre une feuille (bottom sheet) : montant (pré-rempli avec le solde), date,
   confirmation. Paiement partiel supporté. Annulation possible dans les 10 secondes (toast avec « Annuler »).
6. Clients : cartes sur mobile (plus de `min-w-[1100px]`), édition persistante, détail avec ses factures.
7. Accessibilité : `<label htmlFor>` sur tous les champs, textes ≥ 14 px (12 px minimum), contraste AA
   (corrige `#7c9ac8` et équivalents), focus visible partout (retire `outline: none` de BackToTop), landmarks, annonces
   `aria-live` pour les toasts.
8. Animations : retire `framer-motion` (dépendance incluse) au profit de transitions CSS ; respecte
   `prefers-reduced-motion`. Corrige les accents (« Vue générale », etc.).
9. Fuseaux : toutes les dates affichées en `fr-FR` à partir de chaînes YYYY-MM-DD, sans conversion de fuseau.

Critères : aucun scroll horizontal à 390 px ; zones tactiles ≥ 44 px ; Lighthouse accessibilité ≥ 95 ;
parcours « créer une créance → relancer → marquer envoyée → enregistrer un paiement » fluide ;
`npm run check` vert.
```

## P5 — Marque, landing, légal

```
[Préambule] Phase P5 — Marque et légal. Références : REFERENCE.md §3 (MKT-01 à MKT-03, SEC-09, SEC-10), §6 (P5).

1. Landing `/` : réécris le contenu pour le gérant de PME sur téléphone. Promesse : « Voyez qui relancer
   aujourd'hui, envoyez le bon message en moins d'une minute. » Supprime TOUS les chiffres de performance
   inventés (+28 %, 82,4 %, 94 %, 3x, −40 %, +2,5x) et toute mention de « 24/7 » ou de relances automatiques
   envoyées aux clients. Tu peux citer uniquement des chiffres sourcés, avec leur source (80 % des créances
   récupérables à J+30, 30 % après 90 j — tirés du CDC ; indique « source à citer »). Ajoute un menu
   mobile (la navigation est actuellement `hidden md:flex`).
2. Une seule marque : « NowPay » partout (titres, métadonnées, e-mails, logo). Canonical = https://www.nowpay.website ;
   ajoute les balises canonical et OG ; redirige le domaine `now-one-sigma.vercel.app` vers le canonique
   (configuration Vercel à documenter dans docs/SUPABASE.md → renomme-le docs/OPS.md) ou à défaut
   `noindex`.
3. Pages `/mentions-legales` et `/confidentialite` : rédige un premier texte clair en français (données
   collectées : compte du gérant, coordonnées des débiteurs saisies par le gérant ; finalités ; sous-traitants :
   Supabase, Vercel, Google [Gemini] ; durée de conservation ; droits ; contact). Marque-les « à relire par un
   juriste avant exploitation commerciale ».
4. Case de consentement à l'inscription (CGU + confidentialité) ; le gérant atteste avoir le droit de saisir
   les coordonnées de ses clients.
5. Suppression de compte : bouton dans les paramètres → supprime l'entreprise et toutes ses données en
   cascade (action serveur + confirmation par saisie du nom), puis déconnecte. Export CSV des créances.

Critères : aucune affirmation inexacte sur la landing ; une seule marque ; suppression de compte testée sur `dev`.
```

## P6 — Récapitulatif quotidien

```
[Préambule] Phase P6 — Récapitulatif quotidien. Références : REFERENCE.md §1 (D-07), §4.1 (point 8), §6 (P6).

1. `lib/supabase/admin.ts` : client `service_role`, marqué `import 'server-only'`. C'est le SEUL endroit
   autorisé. Lit `SUPABASE_SERVICE_ROLE_KEY` depuis l'environnement serveur.
2. Route `app/api/cron/digest/route.ts` : protégée par `Authorization: Bearer ${CRON_SECRET}` (refus 401
   sinon). Pour chaque entreprise avec `digest_actif = true` : charge ses créances, calcule le timing via
   lib/domain (date du jour en UTC), et envoie UN e-mail s'il y a au moins une relance à faire :
   « Aujourd'hui : N relances à faire », liste (client, solde, jours de retard, niveau) et lien direct vers
   `/dashboard`. Aucun contenu de message de relance ; aucune donnée de débiteur au-delà du nom et du solde.
3. Envoi via Resend (ou le SMTP personnalisé de Supabase s'il est déjà configuré) derrière une petite
   interface `lib/mail`. Variable `RESEND_API_KEY` dans `.env.example`.
4. `vercel.json` : cron quotidien à 07:00 UTC (= 07:00 à Lomé).
5. Paramètres : interrupteur « Recevoir le récapitulatif quotidien » (met à jour `companies.digest_actif`).
   Lien de désinscription dans l'e-mail.
6. Tests : sans secret → 401 ; entreprise sans relance → aucun envoi ; erreur d'envoi d'une entreprise ne
   bloque pas les autres.

Critères : e-mail reçu sur `dev` avec la liste du jour ; aucune utilisation de service_role hors admin.ts
(vérifie avec une recherche dans le dépôt) ; `npm run check` vert.
```

## Prompt de revue (à lancer après CHAQUE phase, dans une conversation neuve)

```
Revue en lecture seule du dernier merge (`git diff main~1`). Ne modifie aucun fichier.
Pour la phase [Pn] de docs/REFERENCE.md §6, vérifie un par un les critères d'acceptation et réponds
« OK / PARTIEL / KO » avec fichier:ligne. Puis cherche : (1) Server Action sans requireUser, (2) règle
métier dupliquée hors lib/domain, (3) usage de service_role hors lib/supabase/admin.ts, (4) entrée non
validée par zod, (5) dépendance ajoutée sans justification, (6) fonctionnalité V2 introduite, (7) cible
tactile < 44 px ou label manquant dans les fichiers touchés, (8) secrets ou valeurs d'environnement dans
le diff. Termine par une liste « à corriger avant merge » classée par gravité.
```
