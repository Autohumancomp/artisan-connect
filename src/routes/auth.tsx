import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Hammer, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — FidèlArtisan" },
      {
        name: "description",
        content:
          "Espace de connexion FidèlArtisan : suivez les entretiens de vos clients et envoyez vos relances en un clic.",
      },
      { property: "og:title", content: "Connexion — FidèlArtisan" },
      {
        property: "og:description",
        content: "Accédez à votre espace de relance d'entretien client.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resterConnecte, setResterConnecte] = useState(true);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/tableau-de-bord", replace: true });
    });
  }, [navigate]);

  async function connexion(event: React.FormEvent) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: motDePasse,
    });
    setEnCours(false);
    if (error) {
      const message =
        error.message.toLowerCase().includes("invalid") || error.status === 400
          ? "Email ou mot de passe incorrect."
          : "Connexion impossible pour le moment. Réessayez dans un instant.";
      setErreur(message);
      toast.error(message);
      return;
    }
    memoriserChoixSession(resterConnecte);
    navigate({ to: "/tableau-de-bord", replace: true });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex items-center gap-2 text-primary">
        <Hammer className="size-6" />
        <span className="text-xl font-semibold tracking-tight">FidèlArtisan</span>
      </div>

      <div className="panel w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold">Connexion à votre espace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos identifiants vous sont fournis par l'administrateur.
        </p>

        <form onSubmit={connexion} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mdp">Mot de passe</Label>
            <Input
              id="mdp"
              type="password"
              autoComplete="current-password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={enCours}>
            {enCours ? <Loader2 className="size-4 animate-spin" /> : null}
            Se connecter
          </Button>
        </form>
      </div>

      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Pas encore de compte ? Les comptes artisans sont créés par l'administrateur.
      </p>
    </main>
  );
}
