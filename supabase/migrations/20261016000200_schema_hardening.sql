ALTER TABLE public.companies
  ADD COLUMN seuil_montant_eleve BIGINT NOT NULL DEFAULT 200000,
  ADD COLUMN digest_actif BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_id_company_id_key UNIQUE (id, company_id);

CREATE SEQUENCE public.factures_numero_seq;
ALTER TABLE public.factures ADD COLUMN numero TEXT;
UPDATE public.factures
SET numero = 'FAC-' || lpad(nextval('public.factures_numero_seq')::TEXT, 8, '0');
ALTER SEQUENCE public.factures_numero_seq OWNED BY public.factures.numero;
ALTER TABLE public.factures
  ALTER COLUMN numero SET DEFAULT (
    'FAC-' || lpad(nextval('public.factures_numero_seq')::TEXT, 8, '0')
  ),
  ALTER COLUMN numero SET NOT NULL;

ALTER TABLE public.factures
  DROP CONSTRAINT factures_client_id_fkey,
  DROP CONSTRAINT factures_statut_check,
  DROP CONSTRAINT factures_score_risque_check,
  DROP CONSTRAINT factures_niveau_risque_check,
  DROP COLUMN score_risque,
  DROP COLUMN niveau_risque,
  ALTER COLUMN montant_fcfa TYPE BIGINT USING round(montant_fcfa)::BIGINT,
  ALTER COLUMN date_service TYPE DATE USING (date_service AT TIME ZONE 'UTC')::DATE,
  ALTER COLUMN date_echeance TYPE DATE USING (date_echeance AT TIME ZONE 'UTC')::DATE,
  ADD CONSTRAINT factures_statut_check
    CHECK (statut IN ('en_attente', 'partielle', 'payee', 'annulee')),
  ADD CONSTRAINT factures_id_company_id_key UNIQUE (id, company_id),
  ADD CONSTRAINT factures_company_client_fkey
    FOREIGN KEY (client_id, company_id)
    REFERENCES public.clients (id, company_id) ON DELETE CASCADE,
  ADD CONSTRAINT factures_company_numero_key UNIQUE (company_id, numero);

ALTER TABLE public.relances
  ADD COLUMN company_id UUID,
  ADD COLUMN source TEXT NOT NULL DEFAULT 'template',
  ADD COLUMN envoyee_at TIMESTAMPTZ;
UPDATE public.relances AS relance
SET company_id = facture.company_id
FROM public.factures AS facture
WHERE facture.id = relance.facture_id;
UPDATE public.relances SET statut_envoi = 'generee';
ALTER TABLE public.relances
  DROP CONSTRAINT relances_facture_id_fkey,
  ALTER COLUMN company_id SET NOT NULL,
  ALTER COLUMN statut_envoi SET DEFAULT 'generee',
  ALTER COLUMN statut_envoi SET NOT NULL,
  ADD CONSTRAINT relances_statut_envoi_check
    CHECK (statut_envoi IN ('generee', 'copiee', 'envoyee')),
  ADD CONSTRAINT relances_source_check CHECK (source IN ('ia', 'template')),
  ADD CONSTRAINT relances_company_facture_fkey
    FOREIGN KEY (facture_id, company_id)
    REFERENCES public.factures (id, company_id) ON DELETE CASCADE;

ALTER TABLE public.paiements
  ADD COLUMN company_id UUID;
UPDATE public.paiements AS paiement
SET company_id = facture.company_id
FROM public.factures AS facture
WHERE facture.id = paiement.facture_id;
ALTER TABLE public.paiements
  DROP CONSTRAINT paiements_facture_id_fkey,
  ALTER COLUMN company_id SET NOT NULL,
  ALTER COLUMN montant_paye TYPE BIGINT USING round(montant_paye)::BIGINT,
  ALTER COLUMN date_paiement TYPE DATE USING (date_paiement AT TIME ZONE 'UTC')::DATE,
  ADD CONSTRAINT paiements_company_facture_fkey
    FOREIGN KEY (facture_id, company_id)
    REFERENCES public.factures (id, company_id) ON DELETE CASCADE;

CREATE TABLE public.ai_usage (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ai_usage_user_kind_created_idx
  ON public.ai_usage (user_id, kind, created_at);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_usage FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_ai_quota(
  p_kind TEXT,
  p_max_heure INT,
  p_max_jour INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  checked_at TIMESTAMPTZ := statement_timestamp();
  heure_count BIGINT;
  jour_count BIGINT;
BEGIN
  IF current_user_id IS NULL OR p_kind IS NULL OR p_kind = ''
    OR p_max_heure < 0 OR p_max_jour < 0 THEN
    RETURN FALSE;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::TEXT || ':' || p_kind, 0)
  );

  SELECT
    pg_catalog.count(*) FILTER (WHERE created_at >= checked_at - INTERVAL '1 hour'),
    pg_catalog.count(*) FILTER (WHERE created_at >= checked_at - INTERVAL '1 day')
  INTO heure_count, jour_count
  FROM public.ai_usage
  WHERE user_id = current_user_id AND ai_usage.kind = p_kind;

  IF heure_count >= p_max_heure OR jour_count >= p_max_jour THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.ai_usage (user_id, kind) VALUES (current_user_id, p_kind);
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_ai_quota(TEXT, INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(TEXT, INT, INT) TO authenticated;

DROP POLICY "Utilisateurs peuvent voir leur propre entreprise" ON public.companies;
DROP POLICY "Utilisateurs peuvent insérer leur propre entreprise" ON public.companies;
DROP POLICY "Utilisateurs peuvent modifier leur propre entreprise" ON public.companies;
DROP POLICY "Utilisateurs gèrent les clients de leur entreprise" ON public.clients;
DROP POLICY "Utilisateurs gèrent les factures de leur entreprise" ON public.factures;
DROP POLICY "Utilisateurs voient les relances de leurs factures" ON public.relances;
DROP POLICY "Utilisateurs voient les paiements de leurs factures" ON public.paiements;

CREATE POLICY companies_select_own ON public.companies
  FOR SELECT USING (id = (SELECT auth.uid()));
CREATE POLICY companies_insert_own ON public.companies
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY companies_update_own ON public.companies
  FOR UPDATE USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY companies_delete_own ON public.companies
  FOR DELETE USING (id = (SELECT auth.uid()));

CREATE POLICY clients_select_own ON public.clients
  FOR SELECT USING (company_id = (SELECT auth.uid()));
CREATE POLICY clients_insert_own ON public.clients
  FOR INSERT WITH CHECK (company_id = (SELECT auth.uid()));
CREATE POLICY clients_update_own ON public.clients
  FOR UPDATE USING (company_id = (SELECT auth.uid()))
  WITH CHECK (company_id = (SELECT auth.uid()));
CREATE POLICY clients_delete_own ON public.clients
  FOR DELETE USING (company_id = (SELECT auth.uid()));

CREATE POLICY factures_select_own ON public.factures
  FOR SELECT USING (company_id = (SELECT auth.uid()));
CREATE POLICY factures_insert_own ON public.factures
  FOR INSERT WITH CHECK (company_id = (SELECT auth.uid()));
CREATE POLICY factures_update_own ON public.factures
  FOR UPDATE USING (company_id = (SELECT auth.uid()))
  WITH CHECK (company_id = (SELECT auth.uid()));
CREATE POLICY factures_delete_own ON public.factures
  FOR DELETE USING (company_id = (SELECT auth.uid()));

CREATE POLICY relances_select_own ON public.relances
  FOR SELECT USING (company_id = (SELECT auth.uid()));
CREATE POLICY relances_insert_own ON public.relances
  FOR INSERT WITH CHECK (
    company_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.factures AS facture
      WHERE facture.id = relances.facture_id
        AND facture.company_id = (SELECT auth.uid())
    )
  );
CREATE POLICY relances_update_own ON public.relances
  FOR UPDATE USING (company_id = (SELECT auth.uid()))
  WITH CHECK (
    company_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.factures AS facture
      WHERE facture.id = relances.facture_id
        AND facture.company_id = (SELECT auth.uid())
    )
  );
CREATE POLICY relances_delete_own ON public.relances
  FOR DELETE USING (company_id = (SELECT auth.uid()));

CREATE POLICY paiements_select_own ON public.paiements
  FOR SELECT USING (company_id = (SELECT auth.uid()));
CREATE POLICY paiements_insert_own ON public.paiements
  FOR INSERT WITH CHECK (
    company_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.factures AS facture
      WHERE facture.id = paiements.facture_id
        AND facture.company_id = (SELECT auth.uid())
    )
  );
CREATE POLICY paiements_update_own ON public.paiements
  FOR UPDATE USING (company_id = (SELECT auth.uid()))
  WITH CHECK (
    company_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.factures AS facture
      WHERE facture.id = paiements.facture_id
        AND facture.company_id = (SELECT auth.uid())
    )
  );
CREATE POLICY paiements_delete_own ON public.paiements
  FOR DELETE USING (company_id = (SELECT auth.uid()));

DROP INDEX public.idx_factures_company_id;
DROP INDEX public.idx_relances_facture_id;
DROP INDEX public.idx_clients_company_id;
CREATE INDEX idx_clients_company_nom ON public.clients(company_id, nom);
CREATE INDEX idx_factures_company_echeance ON public.factures(company_id, date_echeance);
CREATE INDEX idx_relances_facture_created ON public.relances(facture_id, created_at);
