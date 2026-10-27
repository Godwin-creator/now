# Historique des phases NowPay

Synthèse fondée sur les branches, leurs commits first-parent et `docs/REFERENCE.md`.
Les tags `phase-*` ne sont pas présents dans les références Git consultées.

| Phase | Date du dernier commit de branche | Tag correspondant |
|---|---|---|
| P0 — Fondations (`p0-fondations`) | 2026-10-16 | `phase-p0-fondations` — absent |
| P1 — Core (`p1-core`) | 2026-10-16 | `phase-p1-core` — absent |
| P2 — Domaine (`p2-domaine`) | 2026-10-16 | `phase-p2-domaine` — absent |
| P3 — Actions et IA (`p3-actions-ia`) | 2026-10-16 | `phase-p3-actions-ia` — absent |
| P4 — UX mobile (`p4-ux-mobile`) | 2026-10-17 | `phase-p4-ux-mobile` — absent |
| P5 — Marque et légal (`p5-marque-legal`) | 2026-10-17 | `phase-p5-marque-legal` — absent |
| P6 — Digest (`p6-digest`) | 2026-10-17 | `phase-p6-digest` — absent |
| Landing V2 (`feat/landing-v2`) | 2026-10-27 | non documenté — aucun tag trouvé |
| Accès unifié (`feat/auth-unifiee`) | non documenté | non documenté — branche absente |

## P0 — Fondations

**Objectif :** établir les fondations sécurisées et les conventions du projet.

**Fait :**

- Ajout des conventions d’agents et des documents de refonte.
- Commit de fondations sécurisées NowPay.

**Décisions notables et pourquoi :** D-03 prévoit des branches courtes et des previews; D-08 sépare les projets Supabase `dev` et `prod` pour isoler les essais de la production.

**À vérifier manuellement :** accès à `/dashboard` sans session refusé; résultat de l’audit des dépendances conforme au critère P0 de `docs/REFERENCE.md`.

**Dernier commit :** `34a4346` (2026-10-16). **Tag :** `phase-p0-fondations` (absent).

## P1 — Core

**Objectif :** mettre en place le cœur Supabase, les migrations, les règles RLS, l’inscription et l’onboarding.

**Fait :**

- Ajout des migrations Supabase, des types et des règles RLS (`a87884f`).
- Ajout de la confirmation par code et de l’onboarding idempotent (`0db9100`).

**Décisions notables et pourquoi :** D-10 prévoit la confirmation de l’inscription par code e-mail; D-11 place la création d’entreprise après l’authentification, sur `/onboarding`.

**À vérifier manuellement :** isolation entre deux utilisateurs, policies relues, configuration SMTP et parcours code valide/invalide conformément aux critères P1 et P1.5 de `docs/REFERENCE.md`.

**Dernier commit :** `0db9100` (2026-10-16). **Tag :** `phase-p1-core` (absent).

## P2 — Domaine

**Objectif :** centraliser et tester les règles métier pures.

**Fait :** commit « feat: add coverage support and enhance domain logic » (`86173f4`).

**Décisions notables et pourquoi :** D-05 fixe un score de risque déterministe dans une fonction pure; la référence demande de calculer score, niveau et statut à la lecture.

**À vérifier manuellement :** non documenté. La référence décrit surtout des critères automatisés de couverture et de cas limites.

**Dernier commit :** `86173f4` (2026-10-16). **Tag :** `phase-p2-domaine` (absent).

## P3 — Actions et IA

**Objectif :** sécuriser les actions serveur et intégrer les relances assistées par IA.

**Fait :** commit « feat: add invoice import, payment processing, and reminder functionalities » (`8dbbab6`).

**Décisions notables et pourquoi :** D-04 choisit Gemini derrière une couche d’abstraction; D-06 maintient la relecture et l’envoi des messages par le gérant.

**À vérifier manuellement :** refus des appels anonymes et au-delà du quota; comportement de repli lorsque Gemini est indisponible, selon les critères P3 de la référence.

**Dernier commit :** `8dbbab6` (2026-10-16). **Tag :** `phase-p3-actions-ia` (absent).

## P4 — UX mobile

**Objectif :** améliorer les parcours de créances sur téléphone.

**Fait :** commit « Améliore l’UX mobile des parcours de créances » (`bfa8aab`).

**Décisions notables et pourquoi :** le périmètre cible l’usage mobile à 390 px et des cibles tactiles de 44 px, selon la référence.

**À vérifier manuellement :** parcours sur un vrai téléphone à 390 px, absence de scroll horizontal, durée de création d’une créance et d’envoi d’une relance, accessibilité.

**Dernier commit :** `bfa8aab` (2026-10-17). **Tag :** `phase-p4-ux-mobile` (absent).

## P5 — Marque et légal

**Objectif :** recentrer le produit sur NowPay et fournir les pages légales.

**Fait :** commit « Ajoute la marque et les mentions légales NowPay » (`c5b4563`).

**Décisions notables et pourquoi :** D-02 fixe la marque NowPay et le domaine canonique `www.nowpay.website`.

**À vérifier manuellement :** absence de chiffres non sourcés, cohérence de la marque et fonctionnement de la suppression de compte, selon les critères P5.

**Dernier commit :** `c5b4563` (2026-10-17). **Tag :** `phase-p5-marque-legal` (absent).

## P6 — Digest

**Objectif :** envoyer au gérant un récapitulatif quotidien des relances.

**Fait :**

- Ajout du récapitulatif quotidien (`e6e5818`).
- Revue et affichage du nom d’entreprise dans le dashboard (`89013ee`).
- Ajout de Vercel Analytics et Speed Insights (`0906c8d`).

**Décisions notables et pourquoi :** D-07 automatise l’e-mail récapitulatif quotidien, pas l’envoi des relances; la référence réserve `service_role` au cron.

**À vérifier manuellement :** réception du courriel du jour, protection de la route par `CRON_SECRET` et opt-in/opt-out, selon les critères P6.

**Dernier commit :** `0906c8d` (2026-10-17). **Tag :** `phase-p6-digest` (absent).

## Landing V2

**Objectif :** évolution de la landing et de son SEO, d’après le nom de branche et les sujets de commits.

**Fait :**

- Amélioration du SEO de la landing (`cd4bb72`).
- Réorganisation des visuels et correction de liens (`6910dda`).
- Remplacement du visuel Open Graph (`b242980`).

**Décisions notables et pourquoi :** D-02 reste la référence de marque et de domaine; les autres décisions propres à cette branche sont non documenté dans `docs/REFERENCE.md`.

**À vérifier manuellement :** synchronisation avec `origin/feat/landing-v2` : la branche locale pointe sur `b242980`, le remote observé sur `6910dda`.

**Dernier commit :** `b242980` (2026-10-27). **Tag :** non documenté.

## Accès unifié

**Objectif :** non documenté. La branche `feat/auth-unifiee` est absente des références consultées.

**Fait :** non documenté pour cette branche. Le commit `4704f9b` (« WIP accès unifié ») apparaît dans l’historique de `feat/landing-v2`; il ne permet pas d’établir une tête de branche distincte.

**Décisions notables et pourquoi :** non documenté.

**À vérifier manuellement :** non documenté.

**Dernier commit :** non documenté. **Tag :** non documenté.

## Comment revenir à une phase

Les tags indiqués ci-dessus sont absents des références consultées; la commande fonctionnera après création du tag correspondant :

```sh
git switch --detach phase-pX-nom
```
