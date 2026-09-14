CREATE OR REPLACE FUNCTION public.my_artisan_id_actif()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id FROM public.artisans
  WHERE (user_id = auth.uid()
     OR (user_id IS NULL AND lower(email) = lower(auth.jwt() ->> 'email')))
    AND statut_abonnement = 'actif'
  LIMIT 1
$$;