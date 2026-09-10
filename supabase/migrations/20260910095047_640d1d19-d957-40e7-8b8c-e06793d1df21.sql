DROP POLICY "Artisan voit sa fiche" ON public.artisans;
DROP POLICY "Artisan modifie sa fiche" ON public.artisans;
DROP POLICY "Artisan actif voit ses clients" ON public.clients;
DROP POLICY "Artisan actif ajoute ses clients" ON public.clients;
DROP POLICY "Artisan actif modifie ses clients" ON public.clients;
DROP POLICY "Artisan actif supprime ses clients" ON public.clients;

ALTER TABLE public.clients ALTER COLUMN artisan_id DROP DEFAULT;
DROP FUNCTION public.my_artisan_id();
DROP FUNCTION public.my_artisan_id_actif();

CREATE OR REPLACE FUNCTION public.my_artisan_id_actif()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id FROM public.artisans WHERE statut_abonnement = 'actif' LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.my_artisan_id_actif() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_artisan_id_actif() TO authenticated;

ALTER TABLE public.clients ALTER COLUMN artisan_id SET DEFAULT public.my_artisan_id_actif();

CREATE POLICY "Artisan voit sa fiche" ON public.artisans
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR (user_id IS NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  );
CREATE POLICY "Artisan modifie sa fiche" ON public.artisans
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
    OR (user_id IS NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  ) WITH CHECK (
    user_id = auth.uid()
    OR (user_id IS NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  );

CREATE POLICY "Artisan actif voit ses clients" ON public.clients
  FOR SELECT TO authenticated USING (
    artisan_id IN (SELECT id FROM public.artisans WHERE statut_abonnement = 'actif')
  );
CREATE POLICY "Artisan actif ajoute ses clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (
    artisan_id IN (SELECT id FROM public.artisans WHERE statut_abonnement = 'actif')
  );
CREATE POLICY "Artisan actif modifie ses clients" ON public.clients
  FOR UPDATE TO authenticated USING (
    artisan_id IN (SELECT id FROM public.artisans WHERE statut_abonnement = 'actif')
  ) WITH CHECK (
    artisan_id IN (SELECT id FROM public.artisans WHERE statut_abonnement = 'actif')
  );
CREATE POLICY "Artisan actif supprime ses clients" ON public.clients
  FOR DELETE TO authenticated USING (
    artisan_id IN (SELECT id FROM public.artisans WHERE statut_abonnement = 'actif')
  );