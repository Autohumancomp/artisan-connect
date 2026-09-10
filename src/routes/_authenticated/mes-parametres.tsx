import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useArtisan } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/mes-parametres")({
  head: () => ({
    meta: [
      { title: "Mes paramètres — FidèlArtisan" },
      {
        name: "description",
        content:
          "Personnalisez le message de relance envoyé à vos clients et consultez les coordonnées de votre entreprise.",
      },
      { property: "og:title", content: "Mes paramètres — FidèlArtisan" },
      {
        property: "og:description",
        content: "Modifiez votre modèle de message de relance d'entretien.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Parametres,
});

function Parametres() {
  const { data: artisan } = useArtisan();
  const queryClient = useQueryClient();
  const [modele, setModele] = useState("");

  useEffect(() => {
    if (artisan) setModele(artisan.modele_message);
  }, [artisan]);

  const sauver = useMutation({
    mutationFn: async () => {
      if (!artisan) throw new Error("Compte introuvable.");
      const { error } = await supabase
        .from("artisans")
        .update({ modele_message: modele })
        .eq("id", artisan.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Modèle de message enregistré");
      await queryClient.invalidateQueries({ queryKey: ["artisan"] });
    },
    onError: (error: Error) =>
      toast.error("Enregistrement impossible", { description: error.message }),
  });

  if (!artisan) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mes paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Votre message de relance et vos coordonnées.
        </p>
      </div>

      <section className="panel p-4">
        <h2 className="text-sm font-semibold">Mon entreprise</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Nom</dt>
            <dd className="font-medium">{artisan.nom_entreprise}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="font-medium break-all">{artisan.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Téléphone</dt>
            <dd className="font-medium">{artisan.telephone || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel p-4">
        <h2 className="text-sm font-semibold">Message de relance</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Utilisez <code className="rounded bg-muted px-1">{"{{nom_client}}"}</code> et{" "}
          <code className="rounded bg-muted px-1">{"{{equipement}}"}</code> : ils seront remplacés
          par les informations du client à l'envoi.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="modele">Contenu du message</Label>
          <Textarea
            id="modele"
            rows={10}
            value={modele}
            onChange={(event) => setModele(event.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => sauver.mutate()} disabled={sauver.isPending}>
            {sauver.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </div>
      </section>
    </div>
  );
}
