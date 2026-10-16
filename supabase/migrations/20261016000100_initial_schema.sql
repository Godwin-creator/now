-- Schéma de référence historique repris de supabase/schema.sql.

CREATE TABLE public.companies (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT 'Mon Entreprise',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  whatsapp TEXT,
  profil TEXT NOT NULL CHECK (profil IN ('particulier informel', 'professionnel', 'corporate')),
  secteur TEXT DEFAULT 'Autre',
  retards_precedents INT NOT NULL DEFAULT 0 CHECK (retards_precedents >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  montant_fcfa NUMERIC NOT NULL CHECK (montant_fcfa > 0),
  date_service TIMESTAMPTZ NOT NULL,
  date_echeance TIMESTAMPTZ NOT NULL,
  delai_paiement_jours INT DEFAULT 30,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'payee', 'annulee')),
  type_relation TEXT NOT NULL CHECK (type_relation IN ('regulier', 'nouveau', 'difficile')),
  canal_contact TEXT NOT NULL CHECK (canal_contact IN ('whatsapp', 'email', 'sms', 'tel', 'tous')),
  score_risque INT NOT NULL CHECK (score_risque BETWEEN 0 AND 100),
  niveau_risque TEXT NOT NULL CHECK (niveau_risque IN ('Faible', 'Moyen', 'Élevé', 'Critique')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.relances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  canal TEXT NOT NULL,
  message_genere TEXT NOT NULL,
  statut_envoi TEXT DEFAULT 'envoye',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  montant_paye NUMERIC NOT NULL CHECK (montant_paye > 0),
  date_paiement TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_factures_company_id ON public.factures(company_id);
CREATE INDEX idx_factures_client_id ON public.factures(client_id);
CREATE INDEX idx_factures_statut ON public.factures(statut);
CREATE INDEX idx_factures_score_risque ON public.factures(score_risque DESC);
CREATE INDEX idx_relances_facture_id ON public.relances(facture_id);
CREATE INDEX idx_paiements_facture_id ON public.paiements(facture_id);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leur propre entreprise"
  ON public.companies FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Utilisateurs peuvent insérer leur propre entreprise"
  ON public.companies FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Utilisateurs peuvent modifier leur propre entreprise"
  ON public.companies FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Utilisateurs gèrent les clients de leur entreprise"
  ON public.clients FOR ALL USING (auth.uid() = company_id);
CREATE POLICY "Utilisateurs gèrent les factures de leur entreprise"
  ON public.factures FOR ALL USING (auth.uid() = company_id);
CREATE POLICY "Utilisateurs voient les relances de leurs factures"
  ON public.relances FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.factures
      WHERE factures.id = relances.facture_id
        AND factures.company_id = auth.uid()
    )
  );
CREATE POLICY "Utilisateurs voient les paiements de leurs factures"
  ON public.paiements FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.factures
      WHERE factures.id = paiements.facture_id
        AND factures.company_id = auth.uid()
    )
  );
