import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { emailValide } from "@/lib/fidel";

interface LigneImport {
  nom_client: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  type_equipement: string | null;
  date_dernier_entretien: string | null;
  probleme: string | null;
}

function decouperLigne(ligne: string): string[] {
  const cellules: string[] = [];
  let courant = "";
  let entreGuillemets = false;
  for (let i = 0; i < ligne.length; i += 1) {
    const c = ligne[i];
    if (c === '"') {
      if (entreGuillemets && ligne[i + 1] === '"') {
        courant += '"';
        i += 1;
      } else {
        entreGuillemets = !entreGuillemets;
      }
    } else if ((c === "," || c === ";") && !entreGuillemets) {
      cellules.push(courant);
      courant = "";
    } else {
      courant += c;
    }
  }
  cellules.push(courant);
  return cellules.map((v) => v.trim());
}

/** Convertit "12/03/2024", "2024-03-12" ou "12-03-2024" en "2024-03-12". */
function normaliserDate(valeur: string): string | null {
  const v = valeur.trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
}

const ALIAS: Record<string, keyof LigneImport> = {
  nom: "nom_client",
  "nom client": "nom_client",
  nom_client: "nom_client",
  client: "nom_client",
  telephone: "telephone",
  téléphone: "telephone",
  tel: "telephone",
  email: "email",
  mail: "email",
  adresse: "adresse",
  equipement: "type_equipement",
  équipement: "type_equipement",
  "type d'equipement": "type_equipement",
  "type d'équipement": "type_equipement",
  type_equipement: "type_equipement",
  "dernier entretien": "date_dernier_entretien",
  "date du dernier entretien": "date_dernier_entretien",
  date_dernier_entretien: "date_dernier_entretien",
};

function analyser(texte: string): LigneImport[] {
  const lignes = texte
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lignes.length < 2) return [];

  const entetes = decouperLigne(lignes[0]!).map((h) => h.toLowerCase().replace(/^"|"$/g, ""));
  const colonnes = entetes.map((h) => ALIAS[h] ?? null);

  return lignes.slice(1).map((ligne) => {
    const cellules = decouperLigne(ligne);
    const brut: Record<string, string> = {};
    colonnes.forEach((cle, index) => {
      if (cle) brut[cle] = cellules[index] ?? "";
    });

    const nom = (brut["nom_client"] ?? "").trim();
    const email = (brut["email"] ?? "").trim();
    const dateBrute = (brut["date_dernier_entretien"] ?? "").trim();
    const date = normaliserDate(dateBrute);

    let probleme: string | null = null;
    if (!nom) probleme = "Nom manquant";
    else if (email && !emailValide(email)) probleme = "Email invalide";
    else if (dateBrute && !date) probleme = "Date illisible (JJ/MM/AAAA)";

    return {
      nom_client: nom,
      telephone: (brut["telephone"] ?? "").trim() || null,
      email: email || null,
      adresse: (brut["adresse"] ?? "").trim() || null,
      type_equipement: (brut["type_equipement"] ?? "").trim() || null,
      date_dernier_entretien: date,
      probleme,
    };
  });
}

function statutCalcule(date: string | null, frequence: number): "a_venir" | "a_relancer" {
  if (!date) return "a_venir";
  const prochaine = new Date(`${date}T00:00:00`);
  prochaine.setMonth(prochaine.getMonth() + frequence);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prochaine.getTime() <= today.getTime() ? "a_relancer" : "a_venir";
}

export function ImportClientsDialog({
  open,
  onOpenChange,
  frequenceDefaut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frequenceDefaut: number;
}) {
  const [lignes, setLignes] = useState<LigneImport[]>([]);
  const [nomFichier, setNomFichier] = useState("");
  const queryClient = useQueryClient();

  const valides = lignes.filter((l) => !l.probleme);

  const importer = useMutation({
    mutationFn: async () => {
      const payload = valides.map((l) => ({
        nom_client: l.nom_client,
        telephone: l.telephone,
        email: l.email,
        adresse: l.adresse,
        type_equipement: l.type_equipement,
        date_dernier_entretien: l.date_dernier_entretien,
        frequence_relance_mois: frequenceDefaut,
        statut_relance: statutCalcule(l.date_dernier_entretien, frequenceDefaut),
      }));
      const { error } = await supabase.from("clients").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success(`${valides.length} client${valides.length > 1 ? "s" : ""} importé${valides.length > 1 ? "s" : ""}`);
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      reinitialiser();
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error("Import impossible", { description: error.message }),
  });

  function reinitialiser() {
    setLignes([]);
    setNomFichier("");
  }

  async function choisirFichier(fichier: File | undefined) {
    if (!fichier) return;
    const texte = await fichier.text();
    const resultat = analyser(texte);
    setNomFichier(fichier.name);
    setLignes(resultat);
    if (resultat.length === 0) {
      toast.error("Fichier illisible", {
        description: "Vérifiez la première ligne : nom, téléphone, email, adresse, équipement, dernier entretien.",
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(valeur) => {
        if (!valeur) reinitialiser();
        onOpenChange(valeur);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des clients</DialogTitle>
          <DialogDescription>
            Fichier CSV avec les colonnes : nom, téléphone, email, adresse, type d'équipement, date
            du dernier entretien.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="fichier-csv">Fichier CSV</Label>
          <Input
            id="fichier-csv"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => void choisirFichier(event.target.files?.[0])}
          />
          {nomFichier ? (
            <p className="text-xs text-muted-foreground">
              {nomFichier} — {lignes.length} ligne{lignes.length > 1 ? "s" : ""} lue
              {lignes.length > 1 ? "s" : ""}, {valides.length} valide
              {valides.length > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>

        {lignes.length > 0 ? (
          <div className="max-h-72 overflow-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Nom</th>
                  <th className="px-3 py-2 font-medium">Téléphone</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Équipement</th>
                  <th className="px-3 py-2 font-medium">Dernier entretien</th>
                  <th className="px-3 py-2 font-medium">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lignes.map((ligne, index) => (
                  <tr key={index} className={ligne.probleme ? "bg-destructive/5" : undefined}>
                    <td className="px-3 py-2 font-medium">{ligne.nom_client || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{ligne.telephone ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{ligne.email ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {ligne.type_equipement ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {ligne.date_dernier_entretien ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {ligne.probleme ? (
                        <span className="text-destructive">{ligne.probleme}</span>
                      ) : (
                        <span className="text-muted-foreground">À importer</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={valides.length === 0 || importer.isPending}
            onClick={() => importer.mutate()}
          >
            {importer.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Importer {valides.length > 0 ? `${valides.length} client${valides.length > 1 ? "s" : ""}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
