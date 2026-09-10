import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Hammer, LayoutDashboard, Loader2, LogOut, Settings, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { ArtisanRow } from "@/lib/fidel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
      Cette page n'a pas pu se charger. Rafraîchissez pour réessayer.
    </div>
  ),
});

export function useArtisan() {
  return useQuery({
    queryKey: ["artisan"],
    queryFn: async (): Promise<ArtisanRow | null> => {
      const { data, error } = await supabase.from("artisans").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return (data as ArtisanRow | null) ?? null;
    },
  });
}

const liens = [
  { to: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/mes-parametres", label: "Mes paramètres", icon: Settings },
] as const;

function Layout() {
  const { data: artisan, isPending, error } = useArtisan();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function deconnexion() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const bloque = !artisan || artisan.statut_abonnement !== "actif";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/tableau-de-bord" className="flex items-center gap-2 text-primary">
            <Hammer className="size-5" />
            <span className="font-semibold tracking-tight">FidèlArtisan</span>
          </Link>
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 sm:flex">
              {liens.map((lien) => (
                <Link
                  key={lien.to}
                  to={lien.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                    pathname === lien.to && "bg-secondary text-foreground",
                  )}
                >
                  {lien.label}
                </Link>
              ))}
            </nav>
            <Button variant="ghost" size="sm" onClick={deconnexion} aria-label="Se déconnecter">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:pb-10">
        {error ? (
          <p className="panel p-6 text-sm text-muted-foreground">
            Impossible de charger votre compte pour le moment.
          </p>
        ) : bloque ? (
          <div className="panel mx-auto max-w-md p-6 text-center">
            <h1 className="text-lg font-semibold">Accès indisponible</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {artisan
                ? "Votre abonnement est suspendu, contactez l'administrateur."
                : "Votre compte n'est pas encore rattaché à une entreprise. Contactez l'administrateur."}
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card sm:hidden">
        <div className="flex">
          {liens.map((lien) => (
            <Link
              key={lien.to}
              to={lien.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground",
                pathname === lien.to && "text-primary",
              )}
            >
              <lien.icon className="size-5" />
              {lien.label === "Tableau de bord" ? "Accueil" : lien.label.replace("Mes ", "")}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
