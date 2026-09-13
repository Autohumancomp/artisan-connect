ALTER TABLE public.artisans
  ADD COLUMN IF NOT EXISTS frequence_relance_defaut integer NOT NULL DEFAULT 12;

CREATE TABLE public.historique_relances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artisan_id uuid NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  destinataire text,
  statut text NOT NULL DEFAULT 'envoye',
  erreur text,
  envoye_le timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX historique_relances_client_idx ON public.historique_relances (client_id, envoye_le DESC);
CREATE INDEX historique_relances_artisan_idx ON public.historique_relances (artisan_id, envoye_le DESC);

GRANT SELECT, INSERT ON public.historique_relances TO authenticated;
GRANT ALL ON public.historique_relances TO service_role;

ALTER TABLE public.historique_relances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisan actif voit son historique"
ON public.historique_relances
FOR SELECT
TO authenticated
USING (artisan_id IN (SELECT a.id FROM public.artisans a WHERE a.statut_abonnement = 'actif'::statut_abonnement));

CREATE POLICY "Artisan actif ajoute a son historique"
ON public.historique_relances
FOR INSERT
TO authenticated
WITH CHECK (artisan_id IN (SELECT a.id FROM public.artisans a WHERE a.statut_abonnement = 'actif'::statut_abonnement));