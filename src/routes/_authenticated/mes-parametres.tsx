import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          "Personnalisez le message de relance envoyé à vos clients et mettez à jour les coordonnées de votre entreprise.",
      },
      { property: "og:title", content: "Mes paramètres — FidèlArtisan" },
      {
        property: "og:description",
        content: "Modifiez vos coordonnées et votre modèle de message de relance d'entretien.",
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

  const [nomEntreprise, setNomEntreprise] = useState("");
  const [telephone, setTelephone] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [adresse, setAdresse] = useState("");
  const [modele, setModele] = useState("");
  const [frequenceDefaut, setFrequenceDefaut] = useState("12");

  useEffect(() => {
    if (!artisan) return;
    setNomEntreprise(artisan.nom_entreprise);
    setTelephone(artisan.telephone ?? "");
    setEmailContact(artisan.email_contact ?? "");
    setAdresse(artisan.adresse ?? "");
    setModele(artisan.modele_message);
    setFrequenceDefaut(String(artisan.frequence_relance_defaut ?? 12));
  }, [artisan]);

  const sauver = useMutation({
    mutationFn: async () => {
      if (!artisan) throw new Error("Compte introuvable.");
      const { error } = await supabase
        .from("artisans")
        .update({
          nom_entreprise: nomEntreprise.trim() || artisan.nom_entreprise,
          telephone: telephone.trim() || null,
          email_contact: emailContact.trim() || null,
          adresse: adresse.trim() || null,
          modele_message: modele,
          frequence_relance_defaut: Math.min(Math.max(Number(frequenceDefaut) || 12, 1), 120),
        })
        .eq("id", artisan.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Paramètres enregistrés");
      await queryClient.invalidateQueries({ queryKey: ["artisan"] });
    },
    onError: (error: Error) =>
      toast.error("Enregistrement impossible", { description: error.message }),
  });

  if (!artisan) return null;

  return (
    <div className="space-y-6">
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        sauver.mutate();
      }}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mes paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos coordonnées et votre message de relance.
        </p>
      </div>

      <section className="panel space-y-4 p-4">
        <h2 className="text-sm font-semibold">Mon entreprise</h2>

        <div className="space-y-2">
          <Label htmlFor="nom">Nom de l'entreprise</Label>
          <Input id="nom" value={nomEntreprise} onChange={(e) => setNomEntreprise(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tel">Téléphone</Label>
            <Input
              id="tel"
              type="tel"
              inputMode="tel"
              placeholder="06 12 34 56 78"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Email de contact affiché aux clients</Label>
            <Input
              id="contact"
              type="email"
              inputMode="email"
              placeholder={artisan.email}
              value={emailContact}
              onChange={(e) => setEmailContact(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour utiliser votre email de connexion ({artisan.email}).
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adresse">Adresse de l'entreprise (optionnel)</Label>
          <Input
            id="adresse"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="12 rue des Artisans, 75011 Paris"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequence">Fréquence de relance par défaut (mois)</Label>
          <Input
            id="frequence"
            type="number"
            min={1}
            max={120}
            className="sm:max-w-40"
            value={frequenceDefaut}
            onChange={(e) => setFrequenceDefaut(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Valeur pré-remplie automatiquement à l'ajout d'un nouveau client.
          </p>
        </div>
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
      </section>

      <div className="flex justify-end">
        <Button type="submit" className="w-full sm:w-auto" disabled={sauver.isPending}>
          {sauver.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Enregistrer
        </Button>
      </div>
    </form>

    <SectionSecurite email={artisan.email} />
    </div>
  );
}

function SectionSecurite({ email }: { email: string }) {
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const changer = useMutation({
    mutationFn: async () => {
      if (nouveau.length < 8) throw new Error("Le nouveau mot de passe doit faire au moins 8 caractères.");
      if (nouveau !== confirmation) throw new Error("Les deux nouveaux mots de passe ne correspondent pas.");
      const { error: erreurAncien } = await supabase.auth.signInWithPassword({
        email,
        password: ancien,
      });
      if (erreurAncien) throw new Error("Ancien mot de passe incorrect.");
      const { error } = await supabase.auth.updateUser({ password: nouveau });
      if (error) throw new Error(error.message);
    },
    onMutate: () => {
      setErreur(null);
      setSucces(false);
    },
    onSuccess: () => {
      setAncien("");
      setNouveau("");
      setConfirmation("");
      setSucces(true);
      toast.success("Mot de passe modifié");
    },
    onError: (error: Error) => setErreur(error.message),
  });

  return (
    <form
      className="panel space-y-4 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        changer.mutate();
      }}
    >
      <div>
        <h2 className="text-sm font-semibold">Sécurité</h2>
        <p className="mt-1 text-xs text-muted-foreground">Changez votre mot de passe de connexion.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ancien">Ancien mot de passe</Label>
        <PasswordInput
          id="ancien"
          autoComplete="current-password"
          value={ancien}
          onChange={(e) => setAncien(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nouveau">Nouveau mot de passe</Label>
          <PasswordInput
            id="nouveau"
            autoComplete="new-password"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmation">Confirmation</Label>
          <PasswordInput
            id="confirmation"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>
      </div>

      {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
      {succes ? (
        <p className="text-sm font-medium text-primary">Votre mot de passe a bien été modifié.</p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={changer.isPending || !ancien || !nouveau || !confirmation}
        >
          {changer.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Modifier le mot de passe
        </Button>
      </div>
    </form>
  );
}
