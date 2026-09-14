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

-- clients : restreindre aux clients de l'artisan connecté
DROP POLICY IF EXISTS "Artisan actif voit ses clients" ON public.clients;
DROP POLICY IF EXISTS "Artisan actif ajoute ses clients" ON public.clients;
DROP POLICY IF EXISTS "Artisan actif modifie ses clients" ON public.clients;
DROP POLICY IF EXISTS "Artisan actif supprime ses clients" ON public.clients;

CREATE POLICY "Artisan actif voit ses clients" ON public.clients
FOR SELECT TO authenticated
USING (artisan_id = public.my_artisan_id_actif());

CREATE POLICY "Artisan actif ajoute ses clients" ON public.clients
FOR INSERT TO authenticated
WITH CHECK (artisan_id = public.my_artisan_id_actif());

CREATE POLICY "Artisan actif modifie ses clients" ON public.clients
FOR UPDATE TO authenticated
USING (artisan_id = public.my_artisan_id_actif())
WITH CHECK (artisan_id = public.my_artisan_id_actif());

CREATE POLICY "Artisan actif supprime ses clients" ON public.clients
FOR DELETE TO authenticated
USING (artisan_id = public.my_artisan_id_actif());

-- historique_relances : même filtrage
DROP POLICY IF EXISTS "Artisan actif voit son historique" ON public.historique_relances;
DROP POLICY IF EXISTS "Artisan actif ajoute a son historique" ON public.historique_relances;

CREATE POLICY "Artisan actif voit son historique" ON public.historique_relances
FOR SELECT TO authenticated
USING (artisan_id = public.my_artisan_id_actif());

CREATE POLICY "Artisan actif ajoute a son historique" ON public.historique_relances
FOR INSERT TO authenticated
WITH CHECK (
  artisan_id = public.my_artisan_id_actif()
  AND client_id IN (SELECT id FROM public.clients WHERE artisan_id = public.my_artisan_id_actif())
);