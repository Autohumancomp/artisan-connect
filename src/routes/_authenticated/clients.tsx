import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PrioriteBadge, StatutBadge } from "@/components/badges";
import { ClientFormDialog } from "@/components/ClientFormDialog";
import { ImportClientsDialog } from "@/components/ImportClientsDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, prioriteDe, type ClientRow } from "@/lib/fidel";
import { envoyerRelance } from "@/lib/relance.functions";
import { useArtisan } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({
    meta: [
      { title: "Clients — FidèlArtisan" },
      {
        name: "description",
        content:
          "Gérez vos clients, leurs équipements et leurs dates d'entretien, et envoyez une relance par email en un clic.",
      },
      { property: "og:title", content: "Clients — FidèlArtisan" },
      {
        property: "og:description",
        content: "Fichier client, priorités de relance et envoi d'email immédiat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const queryClient = useQueryClient();
  const envoyer = useServerFn(envoyerRelance);

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtrePriorite, setFiltrePriorite] = useState("toutes");
  const [formOuvert, setFormOuvert] = useState(false);
  const [clientEdite, setClientEdite] = useState<ClientRow | null>(null);
  const [aSupprimer, setASupprimer] = useState<ClientRow | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState<string | null>(null);
  const [importOuvert, setImportOuvert] = useState(false);
  const [tri, setTri] = useState<{ cle: CleTri; sens: "asc" | "desc" }>({
    cle: "date_prochaine_relance",
    sens: "asc",
  });
  const { data: artisan } = useArtisan();

  function basculerTri(cle: CleTri) {
    setTri((prev) =>
      prev.cle === cle ? { cle, sens: prev.sens === "asc" ? "desc" : "asc" } : { cle, sens: "asc" },
    );
  }

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

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Client supprimé");
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: Error) =>
      toast.error("Suppression impossible", { description: error.message }),
  });

  const clients = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    const filtres = (data ?? []).filter((client) => {
      const correspond =
        !terme ||
        [client.nom_client, client.telephone, client.email, client.type_equipement]
          .filter(Boolean)
          .some((valeur) => valeur!.toLowerCase().includes(terme));
      const statutOk = filtreStatut === "tous" || client.statut_relance === filtreStatut;
      const prioriteOk =
        filtrePriorite === "toutes" || prioriteDe(client.date_prochaine_relance) === filtrePriorite;
      return correspond && statutOk && prioriteOk;
    });

    const facteur = tri.sens === "asc" ? 1 : -1;
    return [...filtres].sort((a, b) => comparer(a, b, tri.cle) * facteur);
  }, [data, recherche, filtreStatut, filtrePriorite, tri]);

  async function envoyerMaintenant(client: ClientRow) {
    if (!client.email) {
      toast.error("Aucune adresse email", {
        description: "Ajoutez l'email du client avant d'envoyer une relance.",
      });
      return;
    }
    setEnvoiEnCours(client.id);
    try {
      await envoyer({ data: { clientId: client.id } });
      toast.success(`Email envoyé à ${client.nom_client}`, { description: client.email });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (error) {
      toast.error("Envoi impossible", {
        description: error instanceof Error ? error.message : "Réessayez dans un instant.",
      });
    } finally {
      setEnvoiEnCours(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clients.length} client{clients.length > 1 ? "s" : ""} affiché
            {clients.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => {
            setClientEdite(null);
            setFormOuvert(true);
          }}
        >
          <Plus className="size-4" />
          Ajouter un client
        </Button>
      </div>

      <div className="panel space-y-3 p-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher un nom, téléphone, email, équipement…"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={filtreStatut} onValueChange={setFiltreStatut}>
            <SelectTrigger aria-label="Filtrer par statut">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="a_venir">À venir</SelectItem>
              <SelectItem value="a_relancer">À relancer</SelectItem>
              <SelectItem value="relance">Relancé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtrePriorite} onValueChange={setFiltrePriorite}>
            <SelectTrigger aria-label="Filtrer par priorité">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les priorités</SelectItem>
              <SelectItem value="haute">Haute</SelectItem>
              <SelectItem value="moyenne">Moyenne</SelectItem>
              <SelectItem value="basse">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <p className="panel p-8 text-center text-sm text-muted-foreground">
          Aucun client ne correspond. Ajoutez votre premier client pour démarrer vos relances.
        </p>
      ) : (
        <>
          {/* Vue tableau (écrans larges) */}
          <div className="panel hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Équipement</th>
                  <th className="px-4 py-3 font-medium">Dernier entretien</th>
                  <th className="px-4 py-3 font-medium">Prochaine relance</th>
                  <th className="px-4 py-3 font-medium">Priorité</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-4 py-3 font-medium">{client.nom_client}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.type_equipement || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(client.date_dernier_entretien)}
                    </td>
                    <td className="px-4 py-3">{formatDate(client.date_prochaine_relance)}</td>
                    <td className="px-4 py-3">
                      <PrioriteBadge priorite={prioriteDe(client.date_prochaine_relance)} />
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={client.statut_relance} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Actions
                          client={client}
                          envoiEnCours={envoiEnCours === client.id}
                          onEnvoyer={() => envoyerMaintenant(client)}
                          onEditer={() => {
                            setClientEdite(client);
                            setFormOuvert(true);
                          }}
                          onSupprimer={() => setASupprimer(client)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vue cartes (mobile) */}
          <ul className="space-y-3 md:hidden">
            {clients.map((client) => (
              <li key={client.id} className="panel p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{client.nom_client}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {client.type_equipement || "Équipement non précisé"}
                    </p>
                  </div>
                  <PrioriteBadge priorite={prioriteDe(client.date_prochaine_relance)} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Dernier entretien</dt>
                    <dd>{formatDate(client.date_dernier_entretien)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Prochaine relance</dt>
                    <dd>{formatDate(client.date_prochaine_relance)}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatutBadge statut={client.statut_relance} />
                  <div className="flex gap-1">
                    <Actions
                      client={client}
                      envoiEnCours={envoiEnCours === client.id}
                      onEnvoyer={() => envoyerMaintenant(client)}
                      onEditer={() => {
                        setClientEdite(client);
                        setFormOuvert(true);
                      }}
                      onSupprimer={() => setASupprimer(client)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ClientFormDialog open={formOuvert} onOpenChange={setFormOuvert} client={clientEdite} />

      <AlertDialog open={aSupprimer !== null} onOpenChange={(open) => !open && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              {aSupprimer?.nom_client} sera définitivement retiré de votre fichier client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (aSupprimer) supprimer.mutate(aSupprimer.id);
                setASupprimer(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Actions({
  client,
  envoiEnCours,
  onEnvoyer,
  onEditer,
  onSupprimer,
}: {
  client: ClientRow;
  envoiEnCours: boolean;
  onEnvoyer: () => void;
  onEditer: () => void;
  onSupprimer: () => void;
}) {
  return (
    <>
      <Button size="sm" variant="secondary" onClick={onEnvoyer} disabled={envoiEnCours}>
        {envoiEnCours ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        Envoyer
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={onEditer}
        aria-label={`Modifier ${client.nom_client}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={onSupprimer}
        aria-label={`Supprimer ${client.nom_client}`}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </>
  );
}
