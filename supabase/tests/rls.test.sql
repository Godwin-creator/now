BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(21);

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated',
   'rls-a@example.test', '', NOW(), '{}'::JSONB, '{}'::JSONB, NOW(), NOW()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated',
   'rls-b@example.test', '', NOW(), '{}'::JSONB, '{}'::JSONB, NOW(), NOW());

INSERT INTO public.companies (id, nom) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Entreprise A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Entreprise B');

INSERT INTO public.clients (id, company_id, nom, profil) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Client A', 'professionnel'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Client B', 'professionnel');

INSERT INTO public.factures (
  id, company_id, client_id, montant_fcfa, date_service, date_echeance,
  statut, type_relation, canal_contact
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',
  10000, DATE '2026-10-01', DATE '2026-10-31',
  'en_attente', 'regulier', 'email'
), (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc',
  20000, DATE '2026-10-01', DATE '2026-10-31',
  'en_attente', 'regulier', 'email'
);

INSERT INTO public.relances (id, company_id, facture_id, canal, message_genere)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaad',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac',
  'email', 'Relance A'
), (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbe',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd',
  'email', 'Relance B'
);

INSERT INTO public.paiements (id, company_id, facture_id, montant_paye, date_paiement)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaae',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac',
  1000, DATE '2026-10-10'
), (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbf',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd',
  2000, DATE '2026-10-10'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', TRUE);
SELECT set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', TRUE);

SELECT is((SELECT count(*)::INT FROM public.companies), 1, 'A lit uniquement sa société');
SELECT is((SELECT count(*)::INT FROM public.companies WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0, 'A ne lit pas la société B');
SELECT is((SELECT count(*)::INT FROM public.clients WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc'), 0, 'A ne lit pas le client B');
SELECT is((SELECT count(*)::INT FROM public.factures WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd'), 0, 'A ne lit pas la facture B');
SELECT is((SELECT count(*)::INT FROM public.relances WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbe'), 0, 'A ne lit pas la relance B');
SELECT is((SELECT count(*)::INT FROM public.paiements WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbf'), 0, 'A ne lit pas le paiement B');

SELECT is((
  WITH changed AS (
    UPDATE public.companies SET nom = 'Entreprise B modifiée'
    WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    RETURNING id
  ) SELECT count(*)::INT FROM changed
), 0, 'A ne modifie pas la société B');
SELECT is((
  WITH removed AS (
    DELETE FROM public.companies WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    RETURNING id
  ) SELECT count(*)::INT FROM removed
), 0, 'A ne supprime pas la société B');
SELECT is((
  WITH changed AS (
    UPDATE public.clients SET nom = 'Client B modifié'
    WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc'
    RETURNING id
  ) SELECT count(*)::INT FROM changed
), 0, 'A ne modifie pas le client B');
SELECT is((
  WITH removed AS (
    DELETE FROM public.clients WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc'
    RETURNING id
  ) SELECT count(*)::INT FROM removed
), 0, 'A ne supprime pas le client B');
SELECT is((
  WITH changed AS (
    UPDATE public.factures SET montant_fcfa = 1
    WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd'
    RETURNING id
  ) SELECT count(*)::INT FROM changed
), 0, 'A ne modifie pas la facture B');
SELECT is((
  WITH removed AS (
    DELETE FROM public.factures WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd'
    RETURNING id
  ) SELECT count(*)::INT FROM removed
), 0, 'A ne supprime pas la facture B');
SELECT is((
  WITH changed AS (
    UPDATE public.relances SET message_genere = 'Interdit'
    WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbe'
    RETURNING id
  ) SELECT count(*)::INT FROM changed
), 0, 'A ne modifie pas la relance B');
SELECT is((
  WITH removed AS (
    DELETE FROM public.relances WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbe'
    RETURNING id
  ) SELECT count(*)::INT FROM removed
), 0, 'A ne supprime pas la relance B');
SELECT is((
  WITH changed AS (
    UPDATE public.paiements SET montant_paye = 1
    WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbf'
    RETURNING id
  ) SELECT count(*)::INT FROM changed
), 0, 'A ne modifie pas le paiement B');
SELECT is((
  WITH removed AS (
    DELETE FROM public.paiements WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbf'
    RETURNING id
  ) SELECT count(*)::INT FROM removed
), 0, 'A ne supprime pas le paiement B');

SELECT throws_ok(
  $$INSERT INTO public.factures (company_id, client_id, montant_fcfa, date_service, date_echeance, type_relation, canal_contact)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc', 1000, CURRENT_DATE, CURRENT_DATE, 'regulier', 'email')$$,
  '23503',
  'A ne crée pas de facture liée au client B'
);
SELECT throws_ok(
  $$INSERT INTO public.relances (company_id, facture_id, canal, message_genere)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd', 'email', 'Interdit')$$,
  '42501',
  'A ne référence pas la facture B dans une relance'
);
SELECT throws_ok(
  $$INSERT INTO public.paiements (company_id, facture_id, montant_paye)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd', 1000)$$,
  '42501',
  'A ne référence pas la facture B dans un paiement'
);
SELECT throws_ok(
  $$INSERT INTO public.clients (company_id, nom, profil)
    VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Client interdit', 'professionnel')$$,
  '42501',
  'A ne crée pas de client dans la société B'
);
SELECT throws_ok(
  $$UPDATE public.factures SET company_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac'$$,
  '42501',
  'A ne transfère pas sa facture vers la société B'
);

SELECT * FROM finish();
ROLLBACK;
