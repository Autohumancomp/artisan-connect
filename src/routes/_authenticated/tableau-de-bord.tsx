import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Loader2, MailCheck, Users } from "lucide-react";

import { PrioriteBadge } from "@/components/badges";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, joursRestants, prioriteDe, type ClientRow } from "@/lib/fidel";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — FidèlArtisan" },
      {
        name: "description",
        content:
          "Vue d'ensemble de vos relances d'entretien : retards, échéances à moins de 30 jours et nombre de clients.",
      },
      { property: "og:title", content: "Tableau de bord — FidèlArtisan" },
      {
        property: "og:description",
        content: "Suivez vos relances d'entretien client en un coup d'œil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function debutDuMois(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function Dashboard() {
  const { data, isPending } = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<ClientRow[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("date_prochaine_relance", { ascending: true, nullsFirst: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ClientRow[];
    },
  });

  const { data: relancesDuMois } = useQuery({
    queryKey: ["relances-du-mois"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("historique_relances")
        .select("id", { count: "exact", head: true })
        .eq("statut", "envoye")
        .gte("envoye_le", debutDuMois());
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const clients = data ?? [];
  const enRetard = clients.filter((c) => {
    const j = joursRestants(c.date_prochaine_relance);
    return j !== null && j < 0 && c.statut_relance !== "relance";
  });
  const aVenir = clients.filter((c) => {
    const j = joursRestants(c.date_prochaine_relance);
    return j !== null && j >= 0 && j <= 30 && c.statut_relance !== "relance";
  });
  const bientot = clients
    .filter((c) => c.date_prochaine_relance && c.statut_relance !== "relance")
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos prochaines relances d'entretien, triées par urgence.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Relances à venir (30 j)"
          valeur={aVenir.length}
          icon={<CalendarClock className="size-4" />}
        />
        <Stat
          label="Relances en retard"
          valeur={enRetard.length}
          icon={<AlertTriangle className="size-4" />}
          alerte={enRetard.length > 0}
        />
        <Stat label="Clients au total" valeur={clients.length} icon={<Users className="size-4" />} />
        <Stat
          label="Relances envoyées ce mois-ci"
          valeur={relancesDuMois ?? 0}
          icon={<MailCheck className="size-4" />}
        />
      </div>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">À relancer prochainement</h2>
          <Link to="/clients" className="text-sm font-medium text-primary hover:underline">
            Voir tous les clients
          </Link>
        </div>

        {bientot.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucune relance planifiée. Ajoutez vos clients depuis la page Clients.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {bientot.map((client) => {
              const jours = joursRestants(client.date_prochaine_relance);
              return (
                <li key={client.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{client.nom_client}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {client.type_equipement || "Équipement non précisé"} ·{" "}
                      {formatDate(client.date_prochaine_relance)}
                      {jours !== null
                        ? jours < 0
                          ? ` · en retard de ${Math.abs(jours)} j`
                          : ` · dans ${jours} j`
                        : ""}
                    </p>
                  </div>
                  <PrioriteBadge priorite={prioriteDe(client.date_prochaine_relance)} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  valeur,
  icon,
  alerte,
}: {
  label: string;
  valeur: number;
  icon: React.ReactNode;
  alerte?: boolean;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p
        className={
          alerte ? "mt-2 text-3xl font-semibold text-destructive" : "mt-2 text-3xl font-semibold"
        }
      >
        {valeur}
      </p>
    </div>
  );
}
