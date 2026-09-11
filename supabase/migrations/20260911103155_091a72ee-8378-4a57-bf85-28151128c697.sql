ALTER TABLE public.artisans
  ADD COLUMN IF NOT EXISTS email_contact text,
  ADD COLUMN IF NOT EXISTS adresse text;