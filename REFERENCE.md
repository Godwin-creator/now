# NowPay — Document de référence de la refonte

> Version 1.0 — 16 octobre 2026. Source de vérité du chantier. Toute décision qui change ce document y est reportée (section 9, journal).
> Lecture rapide : sections 1 (décisions), 4 (périmètre 1.0), 6 (plan).

---

## 1. Décisions actées

| # | Décision | Origine |
|---|---|---|
| D-01 | Objectif : **vrai produit pour de vrais gérants de PME** (Lomé d'abord), pas une démo | Godwin |
| D-02 | Marque : **NowPay**. Domaine canonique : `www.nowpay.website` (le site y redirige déjà). `now-one-sigma.vercel.app` redirige vers le domaine canonique ou est en `noindex` | Godwin + audit |
| D-03 | Solo. Flux trunk-based : branches courtes par phase, previews Vercel, merge sur `main` si la CI est verte | Godwin |
| D-04 | Fournisseur IA : **Gemini**, derrière une couche d'abstraction (`lib/ai`). Facturation à l'usage activée **avant** l'arrivée de vrais utilisateurs (le palier gratuit peut servir à entraîner les modèles — à vérifier dans les conditions de l'API) | Godwin + revue |
| D-05 | Le **score de risque est déterministe** (fonction pure testée). Le LLM rédige uniquement le message | Revue |
| D-06 | L'IA ne contourne jamais l'humain : le gérant relit, puis envoie lui-même (deep links WhatsApp / mail / SMS). Aucun envoi automatique aux débiteurs en 1.0 | CDC + revue |
| D-07 | L'automatisation 1.0 = **e-mail récapitulatif quotidien au gérant** (pas aux débiteurs) | Revue |
| D-08 | Les données de test actuelles sont supprimées. Deux projets Supabase : `dev` et `prod`, schéma uniquement par migrations versionnées | Godwin + revue |
| D-09 | Calendrier : sprint de lancement du 16 au 21 octobre, puis 1 session bornée par semaine pour les retours (rentrée le 19 octobre) | Godwin |

## 2. Contexte produit (rappel)

NowPay aide le gérant d'une PME (services, commerce, BTP) qui facture des clients professionnels et gère tout depuis son téléphone. Le gérant sait qui n'a pas payé ; il ne sait pas **quoi dire, quand, sur quel canal, avec quel ton**. NowPay répond à ces quatre questions.

Promesse produit : *« Ouvre l'app, vois qui relancer aujourd'hui, envoie le bon message en moins d'une minute. »*

## 3. État des lieux (audit du 16/10/2026)

Audit en lecture seule du dépôt, du schéma `supabase/schema.sql` et du CDC, complété par la lecture du site déployé et d'une capture du dashboard. **Limite :** la RLS réellement active sur le projet Supabase distant n'a pas été vérifiée (phase P1).

### 3.1 Déjà sain

Clé Gemini lue côté serveur uniquement ; aucun `NEXT_PUBLIC_` sensible ; pas de `service_role` ; `getUser()` (et non `getSession`) sur le flux créances / paiements / import ; RLS activée sur les 5 tables, sans `USING (true)` ; aucun `.env` dans l'historique git ; transport WhatsApp / mail / SMS par deep links déjà présent ; `html lang="fr"`.

### 3.2 Constats

Gravité : C = critique, H = haute, M = moyenne, B = basse. « Phase » renvoie à la section 6.

**Sécurité et conformité**

| ID | Constat | Grav. | Phase |
|---|---|---|---|
| SEC-01 | Next 16.3.5 : `npm audit` signale 1 critique + 7 hautes (RCE `next/og`, cache poisoning, SSRF image). Monter à ≥ 16.4.2 (vérifier avec `npm audit`) | C | P0 |
| SEC-02 | `scannerFacture` (OCR Gemini) sans `getUser()` : appel anonyme, abus de quota et de coût (`app/actions/ocr.ts:15`) | C | P3 |
| SEC-03 | Aucun rate limit sur génération IA, OCR, import CSV ; aucun timeout sur les appels Gemini | C/H | P3 |
| SEC-04 | **Isolation incomplète entre entreprises** : la policy de `factures` ne contrôle que `company_id = auth.uid()` ; rien n'empêche une facture de référencer le `client_id` d'une autre entreprise. Même risque sur `relances` / `paiements` côté écriture | H | P1 |
| SEC-05 | Schéma non versionné (un seul `schema.sql`), prod potentiellement divergente (fallback `delai_paiement_jours` déjà dans le code). RLS live non vérifiée | H | P1 |
| SEC-06 | Policies `FOR ALL` sans `WITH CHECK` explicite ; pas de policy DELETE sur `companies` (suppression de compte impossible) | M | P1 |
| SEC-07 | Injection de prompt : champs libres (nom client…) insérés dans le prompt. Impact limité (le gérant relit), mais à borner | M | P3 |
| SEC-08 | Confirmation e-mail, politique de mot de passe, URLs de redirection et **SMTP personnalisé** à configurer : le SMTP par défaut de Supabase est très limité et cassera les inscriptions réelles | H | P1 |
| SEC-09 | Données personnelles de tiers (noms, téléphones de débiteurs) : mentions légales, politique de confidentialité, suppression de compte et export minimal absents. La loi togolaise de 2019 sur les données personnelles est à vérifier | H | P5 |
| SEC-10 | Vercel Hobby est prévu pour un usage non commercial : à vérifier avant une exploitation réelle (plan Pro ou autre hébergeur) | M | P5 |

**Données**

| ID | Constat | Grav. | Phase |
|---|---|---|---|
| DATA-01 | `score_risque` / `niveau_risque` stockés à l'insertion : périmés dès le lendemain | H | P1/P2 |
| DATA-02 | Montants en `NUMERIC` ; FCFA = entiers | M | P1 |
| DATA-03 | Types Supabase manuels (`types/index.ts`) | M | P1 |
| DATA-04 | `statut_envoi` : défaut `envoye` en base, `genere` à l'insertion, « Réussi » par défaut dans l'historique : fausse preuve d'envoi | M | P1/P3 |
| DATA-05 | `retards_precedents` jamais incrémenté : le terme « récidive » du scoring est mort | M | P2 |
| DATA-06 | Pas de numéro de facture (le message exemple du CDC en contient un) | M | P1 |
| DATA-07 | Dates : `new Date()` / `toISOString` mélangés ; Lomé est en UTC+0 sans changement d'heure, donc stocker `DATE` et calculer en UTC | H | P2 |

**Domaine**

| ID | Constat | Grav. | Phase |
|---|---|---|---|
| DOM-01 | Scoring **dupliqué** (`creances.ts:9`, `importCsv.ts:20`) et **différent du CDC** : +15 si profil informel ou relation difficile (non prévu) ; `montant_max` fixé à 5 000 000 FCFA. Conséquence visible : 10 000 FCFA à 4 j de retard = 15/100 ; deux dettes identiques (23 j, 2 000) = 25 et 15 | H | P2 |
| DOM-02 | « À relancer aujourd'hui » = toutes les créances `en_attente` : pas de logique de timing ni de cadence | H | P2/P4 |
| DOM-03 | Canal WhatsApp proposé sans numéro (« Sans numéro » sur les 5 lignes) | H | P2/P4 |
| DOM-04 | `marquerCommePayee` renvoie un succès même si 0 ligne modifiée ; pas de paiement partiel alors que `paiements` le permet | H | P3 |
| DOM-05 | Édition d'un client : UI uniquement, jamais persistée | C | P3 |
| DOM-06 | Doublons clients (même nom, deux fiches de facture) | M | P4 |

**IA**

| ID | Constat | Grav. | Phase |
|---|---|---|---|
| IA-01 | Sortie en texte libre non validée ; JSON de l'OCR non validé par schéma | H | P3 |
| IA-02 | Échec Gemini → message générique présenté comme un succès | M | P3 |
| IA-03 | Nom de modèle (`gemini-3.6-flash`) codé en dur : le mettre en variable d'environnement et **vérifier qu'il existe** dans la console Google AI | M | P3 |
| IA-04 | Aucun test | H | P2/P3 |

**UX**

| ID | Constat | Grav. | Phase |
|---|---|---|---|
| UX-01 | L'accueil est un tableau de données, pas une file d'actions : le produit ne dit pas quoi faire aujourd'hui | H | P4 |
| UX-02 | Produit « mobile-first » mais tableau 6 colonnes, `min-w-[1100px]` sur Clients, barre d'outils `w-80` | H | P4 |
| UX-03 | Cibles tactiles < 44 px (Payé / Relancer `py-1.5`, crayon 32 px, raccourcis montant `text-[9px]`) | H | P4 |
| UX-04 | Labels sans `htmlFor`, textes 10 px, contrastes `#7c9ac8` insuffisants, `outline: none` sur BackToTop | M | P4 |
| UX-05 | Formulaire de saisie à 11 champs contre 6 dans le CDC | M | P4 |
| UX-06 | Génération de la relance cachée dans un accordéon fermé | H | P4 |
| UX-07 | Filtres créances incomplets (CDC : statut, risque, jours de retard, canal, recherche) | M | P4 |
| UX-08 | Cosmétique : « Vue generale », statut dupliqué, pas de `loading.tsx` | B | P4 |

**Architecture et ops**

| ID | Constat | Grav. | Phase |
|---|---|---|---|
| ARCH-01 | Pas de couche `lib/` : métier, Supabase et Gemini mélangés dans `app/actions/*` | M | P2/P3 |
| ARCH-02 | Inscription dupliquée (client dans `login/page.tsx` et Server Action) | M | P3 |
| ARCH-03 | Pas de `middleware.ts` : l'auth dépend de chaque page | M | P0 |
| ARCH-04 | Fichiers > 300 lignes (`CreanceForm` 512, `login/page` 488, `creances.ts` 382…) | M | P3/P4 |
| ARCH-05 | `tailwind.config.ts` est un fichier v3 ignoré par Tailwind v4 (pas de `@theme` / `@config`) | H | P0 |
| ARCH-06 | `framer-motion` utilisé partout alors que le CDC le reporte en V2 ; coûteux sur téléphones d'entrée de gamme | M | P4 |
| ARCH-07 | Composant mort `AnimatedSection`, README vide, CDC avec image base64 à la racine | B | P0 |
| OPS-01 | Aucun test, aucune CI | H | P0 |
| OPS-02 | Pas de `error.tsx` / `global-error.tsx` : écran blanc en cas de crash | H | P3 |

**Marque et communication**

| ID | Constat | Grav. | Phase |
|---|---|---|---|
| MKT-01 | Landing : chiffres inventés (+28 %, 82,4 %, 94 %, 3x, −40 %, +2,5x) et « 24/7 », « relances automatiques » qui n'existent pas | H | P5 |
| MKT-02 | Discours « équipes de recouvrement » / « importez vos dossiers » : hors cible (gérant sur téléphone) | M | P5 |
| MKT-03 | Marque éclatée : Now / NowPay, trois URLs | M | P5 |

## 4. Périmètre

### 4.1 NowPay 1.0 (le seul périmètre du sprint)

1. Sécurité vérifiée : dépendances à jour, RLS testée, isolation entre entreprises, quotas IA.
2. Scoring en fonction pure, conforme à la spécification 5.1, testé.
3. Saisie d'une créance en moins de 30 s sur mobile (6 champs + options repliées), OCR derrière authentification et quota.
4. Accueil = **file « À faire aujourd'hui »** triée par priorité.
5. Relance : message généré (JSON validé, repli sur templates) → relecture → ouverture de WhatsApp / mail / SMS pré-rempli → « marquer comme envoyée » → historique.
6. Paiement total ou partiel.
7. Affichage en cartes sur mobile, tableau sur ordinateur.
8. E-mail récapitulatif quotidien (opt-in).
9. Landing honnête, mentions légales, politique de confidentialité, suppression de compte.

### 4.2 Hors périmètre (V2, après retours terrain)

Envoi automatique aux débiteurs, API WhatsApp Business (templates validés par Meta, coût par conversation), passerelle SMS locale, multilingue (éwé / mina), multi-utilisateurs par entreprise, liens de paiement mobile money, tarification.

## 5. Spécifications cibles

### 5.1 Scoring (fonction pure `lib/domain/scoring.ts`)

```
joursRetard   = max(0, aujourd'hui − date_echeance)            // en jours entiers, UTC
soldeRestant  = montant_fcfa − somme(paiements)
terme_retard  = min(joursRetard / 90, 1) × 40
terme_montant = min(soldeRestant / seuilMontantEleve, 1) × 30  // seuil par entreprise, défaut 200 000 FCFA
terme_recidive= min(retardsPrecedents × 10, 30)
score         = round(terme_retard + terme_montant + terme_recidive)   // 0–100

niveau : 0–33 faible · 34–66 moyen · 67–85 élevé · 86–100 critique
```

Écarts assumés par rapport au CDC (à reporter dans le CDC v2) :
- `soldeRestant` remplace `montant` (cohérent avec les paiements partiels).
- `seuilMontantEleve` remplace « montant max », jamais défini dans le CDC. Valeur par défaut **hypothèse** (200 000 FCFA), à valider avec les premiers gérants et à rendre modifiable.
- Le +15 « profil informel / relation difficile » est **supprimé** : profil et relation pilotent le **ton**, pas le score.
- `retardsPrecedents` = nombre de factures du client soldées après leur échéance. **Dérivé**, jamais stocké.

Le score et le niveau ne sont **jamais stockés** : calculés à la lecture (portefeuille d'une PME = dizaines à centaines de lignes).

### 5.2 Timing et cadence (`lib/domain/timing.ts`) — hypothèses à valider terrain

| Niveau | Premier rappel dès | Cadence entre relances | Canal conseillé |
|---|---|---|---|
| Faible | J+7 de retard | 7 jours | selon profil |
| Moyen | J+1 | 4 jours | selon profil |
| Élevé | J+1 | 3 jours | selon profil + escalade |
| Critique | J+1 | 2 jours | **appel recommandé** |

- **Appel recommandé** si retard > 45 jours **ou** niveau critique.
- **À relancer aujourd'hui** = non soldée, échue, premier rappel atteint, et (aucune relance envoyée **ou** dernière relance envoyée il y a ≥ cadence). Seules les relances au statut `envoyee` comptent.
- **Canal effectif** : le canal choisi n'est proposé que si la coordonnée existe (WhatsApp → numéro WhatsApp ; SMS → téléphone ; e-mail → adresse). Sinon, proposer le meilleur canal disponible, ou signaler « coordonnée manquante ».

### 5.3 Modèle de données cible

Changements par rapport à `supabase/schema.sql` (via migrations, jamais en édition directe) :

- `companies` : + `seuil_montant_eleve BIGINT DEFAULT 200000`, `digest_actif BOOLEAN DEFAULT true`. (`id = auth.users.id` : acceptable en mono-admin ; à revoir en V2 multi-utilisateurs.)
- `factures` : `montant_fcfa BIGINT`, `date_service DATE`, `date_echeance DATE`, `numero TEXT` (unique par entreprise, généré), **suppression** de `score_risque` / `niveau_risque`, statut ∈ `en_attente | partielle | payee | annulee`. Contrainte garantissant `client.company_id = facture.company_id` (clé composite `(id, company_id)` sur `clients`, FK composite depuis `factures`).
- `paiements` : `montant_paye BIGINT CHECK (> 0)`, `date_paiement DATE`.
- `relances` : `statut_envoi ∈ generee | copiee | envoyee` (défaut `generee`), `source ∈ ia | template`, `envoyee_at TIMESTAMPTZ`.
- `ai_usage(user_id, kind, created_at)` + fonction `consume_ai_quota(kind, max_heure, max_jour)` (security definer) : quota par utilisateur sans service externe.
- Policies scindées SELECT / INSERT / UPDATE / DELETE avec `WITH CHECK` ; policy DELETE sur `companies`.
- Index : `factures(company_id, date_echeance)`, `relances(facture_id, created_at)`, `clients(company_id, nom)`.
- Types générés avec `supabase gen types` dans `types/database.ts`.

### 5.4 Contrat IA (`lib/ai`)

- Entrée : `{ entreprise, client, montantSolde, joursRetard, ton, canal, numeroFacture, dateEcheance }` — aucune autre donnée personnelle. Les champs libres sont bornés (longueur, caractères de contrôle supprimés) et placés dans un bloc délimité.
- Sortie validée par schéma : `{ objet?: string, corps: string }` (`objet` uniquement pour l'e-mail).
- Contrôles déterministes après génération : pas d'emoji, première personne du pluriel, montant et nom de l'entreprise présents, SMS ≤ 320 caractères. Échec → **template statique** et `source = 'template'`.
- Timeout 15 s, une relance (retry) maximum, erreurs typées (`quota`, `reseau`, `invalide`).
- Modèle et clé via `GEMINI_MODEL` / `GEMINI_API_KEY`. Quotas : 60 générations / jour / utilisateur, 15 OCR / jour (ajustables).
- Ton : corporate → formel et institutionnel ; régulier → direct et courtois ; nouveau → neutre et factuel (CDC §4.3).

## 6. Plan d'action

Chaque phase = une branche courte + une preview Vercel + critères d'acceptation. Les prompts d'exécution sont dans `docs/PROMPTS.md`. Estimations en temps de présence, avec agent de code.

| Phase | Objet | Durée | Critères d'acceptation |
|---|---|---|---|
| **P0 — Fondations** | Next ≥ 16.4.2, `npm audit fix`, `.env.example`, README, `AGENTS.md`, middleware d'auth, Tailwind v4 (`@theme`), Vitest, Prettier, scripts `typecheck` / `check`, CI GitHub Actions, suppression du code mort | ~2 h | `npm run check` vert en local et en CI ; `npm audit` sans critique ni haute (ou exception documentée) ; accès `/dashboard` sans session refusé par le middleware |
| **P1 — Supabase** | Projets `dev` et `prod`, CLI, migration de référence, migrations 5.3, RLS + test des policies, SMTP perso, réglages Auth, types générés, purge des données de test | ~3 h | Un script de test prouve qu'un utilisateur A ne lit, n'écrit et ne référence aucune donnée de B ; `pg_policies` relu ; types générés compilent |
| **P2 — Domaine pur** | `lib/domain` : scoring, timing, canal effectif, argent, dates, statut dérivé de facture, récidive ; tests | ~3 h | Couverture ≥ 90 % sur `lib/domain` ; cas limites testés (0 j, 90 j, > 90 j, paiement partiel, solde nul, coordonnée manquante) ; plus de scoring dupliqué |
| **P3 — Actions et IA** | Server Actions minces (auth → zod → domaine → repo), `getUser` partout dont OCR, quotas `ai_usage`, `lib/ai` (sortie validée, repli templates, timeouts), `updateClient`, paiement partiel, statuts de relance, `error.tsx` / `loading.tsx`, inscription unique | ~4 h | Aucune action sans `requireUser` ; OCR et IA refusent un appel anonyme et au-delà du quota ; une panne Gemini donne un template étiqueté ; tests des actions (mocks) verts |
| **P4 — UX mobile** | File « À faire aujourd'hui », cartes mobiles, formulaire 6 champs, CTA relance visible, cibles 44 px, a11y, filtres CDC, KPI corrigés, accents, remplacement de `framer-motion` par des transitions CSS | ~5 h | Testé à 390 px de large sur un vrai téléphone ; créance créée en < 30 s ; relance envoyée en < 1 min ; aucun scroll horizontal ; Lighthouse accessibilité ≥ 95 |
| **P5 — Marque et légal** | Landing honnête et recentrée, redirections de domaine, mentions légales, confidentialité, suppression de compte, vérification hébergement | ~2 h | Plus aucun chiffre non sourcé ; une seule marque ; suppression de compte fonctionnelle |
| **P6 — Récapitulatif quotidien** | Cron Vercel (07:00 UTC = 07:00 Lomé), e-mail via SMTP / Resend, accès `service_role` isolé dans `lib/supabase/admin.ts` (`server-only`), opt-in / opt-out | ~2 h | E-mail reçu avec la liste du jour ; route protégée par `CRON_SECRET` ; aucune autre utilisation de `service_role` |
| **P7 — Pilote** | 3 à 5 gérants réels, observation de leur première session, journal des retours | continu | 3 gérants créent 3 créances et envoient 1 relance **sans aide** en < 5 min |

### Calendrier

| Jour | Contenu |
|---|---|
| Ven. 16 oct. (soir) | P0 |
| Sam. 17 oct. | P1, P2, début P3 |
| Dim. 18 oct. | fin P3, P4 |
| Lun. 19 – mer. 21 oct. (1 à 2 h / soir) | P5, P6 ; premiers testeurs dès lundi soir si P0–P4 sont verts |
| Jeu. 22 oct. → | P7 + 1 session hebdomadaire bornée sur les retours |

**Règle de coupe :** si une phase déborde, on réduit le périmètre (par exemple, P6 passe en V1.1), jamais le temps de révision.

## 7. Risques

| Risque | Probabilité | Parade |
|---|---|---|
| Aucun gérant n'utilise le produit (problème de marché, pas de code) | Moyenne | P7 dès la fin de P4 ; mesurer l'usage réel (relances envoyées, créances payées) |
| Les seuils (200 000 FCFA, cadences) ne correspondent pas à la réalité des PME | Haute | Paramètres par entreprise ; ajustés après les premiers retours |
| Dérive de l'agent IA (code incohérent, dépendances ajoutées) | Haute | `AGENTS.md`, prompts bornés par phase, CI, relecture du diff avant merge |
| Quota ou coût Gemini | Faible à moyenne | Quotas applicatifs, alerte de budget Google Cloud, repli templates |
| Fuite de données entre entreprises | Faible mais grave | SEC-04, tests d'isolation en P1, revue manuelle des policies |
| Surcharge études / projet | Haute | Règle de coupe, sessions bornées |
| Non-conformité (données personnelles, hébergement) | Moyenne | P5 ; avis d'un juriste si le produit est monétisé |

## 8. Questions ouvertes

1. Quel modèle Gemini exact en production, et quel budget mensuel plafond ?
2. Seuil « montant élevé » et cadences : à confirmer avec 3 gérants.
3. Modèle économique (gratuit pendant le pilote ? abonnement ? commission ?) — décision après P7.
4. Hébergement de production : Vercel Pro ou alternative (voir SEC-10).
5. Le CDC v2 doit être réécrit pour intégrer les écarts de 5.1 et la file d'actions.

## 9. Journal des décisions

| Date | Décision |
|---|---|
| 16/10/2026 | Création du document ; décisions D-01 à D-09 |
