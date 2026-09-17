-- ====================================================================
-- NOW APPLICATION - SCHÉMA DE BASE DE DONNÉES SUPABASE
-- Conforme aux spécifications du Cahier des Charges V1
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: companies
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT 'Mon Entreprise',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 3. Table: factures
CREATE TABLE IF NOT EXISTS public.factures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  montant_fcfa NUMERIC NOT NULL CHECK (montant_fcfa > 0),
  date_service TIMESTAMPTZ NOT NULL,
  date_echeance TIMESTAMPTZ NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'payee', 'annulee')),
  type_relation TEXT NOT NULL CHECK (type_relation IN ('regulier', 'nouveau', 'difficile')),
  canal_contact TEXT NOT NULL CHECK (canal_contact IN ('whatsapp', 'email', 'sms', 'tel')),
  score_risque INT NOT NULL CHECK (score_risque BETWEEN 0 AND 100),
  niveau_risque TEXT NOT NULL CHECK (niveau_risque IN ('Faible', 'Moyen', 'Élevé', 'Critique')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: relances (Journal des messages IA générés / envoyés)
CREATE TABLE IF NOT EXISTS public.relances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  canal TEXT NOT NULL,
  message_genere TEXT NOT NULL,
  statut_envoi TEXT DEFAULT 'envoye',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: paiements (Suivi des règlements)
CREATE TABLE IF NOT EXISTS public.paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  montant_paye NUMERIC NOT NULL CHECK (montant_paye > 0),
  date_paiement TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEX DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_factures_company_id ON public.factures(company_id);
CREATE INDEX IF NOT EXISTS idx_factures_client_id ON public.factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON public.factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_score_risque ON public.factures(score_risque DESC);
CREATE INDEX IF NOT EXISTS idx_relances_facture_id ON public.relances(facture_id);
CREATE INDEX IF NOT EXISTS idx_paiements_facture_id ON public.paiements(facture_id);

-- ROW LEVEL SECURITY (RLS) - MONO-TENANT PAR ENTREPRISE
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

-- POLITIQUES RLS: companies
CREATE POLICY "Utilisateurs peuvent voir leur propre entreprise"
  ON public.companies FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent insérer leur propre entreprise"
  ON public.companies FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent modifier leur propre entreprise"
  ON public.companies FOR UPDATE USING (auth.uid() = id);

-- POLITIQUES RLS: clients
CREATE POLICY "Utilisateurs gèrent les clients de leur entreprise"
  ON public.clients FOR ALL USING (auth.uid() = company_id);

-- POLITIQUES RLS: factures
CREATE POLICY "Utilisateurs gèrent les factures de leur entreprise"
  ON public.factures FOR ALL USING (auth.uid() = company_id);

-- POLITIQUES RLS: relances
CREATE POLICY "Utilisateurs voient les relances de leurs factures"
  ON public.relances FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.factures
      WHERE factures.id = relances.facture_id
      AND factures.company_id = auth.uid()
    )
  );

-- POLITIQUES RLS: paiements
CREATE POLICY "Utilisateurs voient les paiements de leurs factures"
  ON public.paiements FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.factures
      WHERE factures.id = paiements.facture_id
      AND factures.company_id = auth.uid()
    )
  );
