CREATE TYPE public.statut_abonnement AS ENUM ('essai', 'actif', 'suspendu');
CREATE TYPE public.statut_relance AS ENUM ('a_venir', 'a_relancer', 'relance');

CREATE TABLE public.artisans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  nom_entreprise text NOT NULL,
  email text NOT NULL UNIQUE,
  telephone text,
  modele_message text NOT NULL DEFAULT 'Bonjour {{nom_client}},

Il est temps de planifier l''entretien annuel de votre {{equipement}}. Répondez à cet email ou appelez-nous pour convenir d''un rendez-vous.

Bien cordialement,',
  statut_abonnement public.statut_abonnement NOT NULL DEFAULT 'essai',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.artisans TO authenticated;
GRANT ALL ON public.artisans TO service_role;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_artisan_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.artisans
  WHERE user_id = auth.uid()
     OR (user_id IS NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.my_artisan_id_actif()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.artisans
  WHERE (user_id = auth.uid()
     OR (user_id IS NULL AND lower(email) = lower(auth.jwt() ->> 'email')))
    AND statut_abonnement = 'actif'
  LIMIT 1
$$;

CREATE POLICY "Artisan voit sa fiche" ON public.artisans
  FOR SELECT TO authenticated USING (id = public.my_artisan_id());
CREATE POLICY "Artisan modifie sa fiche" ON public.artisans
  FOR UPDATE TO authenticated USING (id = public.my_artisan_id()) WITH CHECK (id = public.my_artisan_id());

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL DEFAULT public.my_artisan_id_actif() REFERENCES public.artisans(id) ON DELETE CASCADE,
  nom_client text NOT NULL,
  telephone text,
  email text,
  adresse text,
  type_equipement text,
  date_dernier_entretien date,
  frequence_relance_mois integer NOT NULL DEFAULT 12,
  date_prochaine_relance date GENERATED ALWAYS AS (
    (date_dernier_entretien + make_interval(months => frequence_relance_mois))::date
  ) STORED,
  statut_relance public.statut_relance NOT NULL DEFAULT 'a_venir',
  notes text,
  derniere_relance_envoyee timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX clients_artisan_idx ON public.clients(artisan_id);
CREATE INDEX clients_prochaine_relance_idx ON public.clients(date_prochaine_relance);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisan actif voit ses clients" ON public.clients
  FOR SELECT TO authenticated USING (artisan_id = public.my_artisan_id_actif());
CREATE POLICY "Artisan actif ajoute ses clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (artisan_id = public.my_artisan_id_actif());
CREATE POLICY "Artisan actif modifie ses clients" ON public.clients
  FOR UPDATE TO authenticated USING (artisan_id = public.my_artisan_id_actif()) WITH CHECK (artisan_id = public.my_artisan_id_actif());
CREATE POLICY "Artisan actif supprime ses clients" ON public.clients
  FOR DELETE TO authenticated USING (artisan_id = public.my_artisan_id_actif());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER artisans_updated_at BEFORE UPDATE ON public.artisans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();