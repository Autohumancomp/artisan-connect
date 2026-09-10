import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { ClientRow } from "@/lib/fidel";

interface Champs {
  nom_client: string;
  telephone: string;
  email: string;
  adresse: string;
  type_equipement: string;
  date_dernier_entretien: string;
  frequence_relance_mois: string;
  notes: string;
}

const vide: Champs = {
  nom_client: "",
  telephone: "",
  email: "",
  adresse: "",
  type_equipement: "",
  date_dernier_entretien: "",
  frequence_relance_mois: "12",
  notes: "",
};

function depuisClient(client: ClientRow): Champs {
  return {
    nom_client: client.nom_client,
    telephone: client.telephone ?? "",
    email: client.email ?? "",
    adresse: client.adresse ?? "",
    type_equipement: client.type_equipement ?? "",
    date_dernier_entretien: client.date_dernier_entretien ?? "",
    frequence_relance_mois: String(client.frequence_relance_mois),
    notes: client.notes ?? "",
  };
}

function statutCalcule(dateEntretien: string, frequence: number): "a_venir" | "a_relancer" {
  if (!dateEntretien) return "a_venir";
  const prochaine = new Date(`${dateEntretien}T00:00:00`);
  prochaine.setMonth(prochaine.getMonth() + frequence);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prochaine.getTime() <= today.getTime() ? "a_relancer" : "a_venir";
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientRow | null;
}) {
  const [champs, setChamps] = useState<Champs>(vide);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setChamps(client ? depuisClient(client) : vide);
  }, [open, client]);

  const enregistrer = useMutation({
    mutationFn: async () => {
      const frequence = Math.max(1, Number(champs.frequence_relance_mois) || 12);
      const payload = {
        nom_client: champs.nom_client.trim(),
        telephone: champs.telephone.trim() || null,
        email: champs.email.trim() || null,
        adresse: champs.adresse.trim() || null,
        type_equipement: champs.type_equipement.trim() || null,
        date_dernier_entretien: champs.date_dernier_entretien || null,
        frequence_relance_mois: frequence,
        notes: champs.notes.trim() || null,
      };

      if (client) {
        const { error } = await supabase.from("clients").update(payload).eq("id", client.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("clients").insert({
          ...payload,
          statut_relance: statutCalcule(champs.date_dernier_entretien, frequence),
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      toast.success(client ? "Client mis à jour" : "Client ajouté");
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Enregistrement impossible", { description: error.message });
    },
  });

  function set<K extends keyof Champs>(cle: K, valeur: string) {
    setChamps((prev) => ({ ...prev, [cle]: valeur }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? "Modifier le client" : "Ajouter un client"}</DialogTitle>
          <DialogDescription>
            La prochaine relance est calculée à partir du dernier entretien et de la fréquence.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            enregistrer.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du client</Label>
            <Input
              id="nom"
              required
              value={champs.nom_client}
              onChange={(e) => set("nom_client", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tel">Téléphone</Label>
              <Input
                id="tel"
                type="tel"
                inputMode="tel"
                value={champs.telephone}
                onChange={(e) => set("telephone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mail">Email</Label>
              <Input
                id="mail"
                type="email"
                inputMode="email"
                value={champs.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={champs.adresse}
              onChange={(e) => set("adresse", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipement">Type d'équipement</Label>
            <Input
              id="equipement"
              placeholder="Chaudière gaz, climatisation, véhicule…"
              value={champs.type_equipement}
              onChange={(e) => set("type_equipement", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dernier">Dernier entretien</Label>
              <Input
                id="dernier"
                type="date"
                value={champs.date_dernier_entretien}
                onChange={(e) => set("date_dernier_entretien", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freq">Fréquence de relance (mois)</Label>
              <Input
                id="freq"
                type="number"
                min={1}
                max={120}
                value={champs.frequence_relance_mois}
                onChange={(e) => set("frequence_relance_mois", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={champs.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={enregistrer.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={enregistrer.isPending}>
              {enregistrer.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
