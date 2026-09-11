import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { appliquerModele } from "@/lib/fidel";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const schema = z.object({ clientId: z.string().uuid() });

function echapper(texte: string): string {
  return texte
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export const envoyerRelance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, nom_client, email, type_equipement, artisan_id")
      .eq("id", data.clientId)
      .maybeSingle();

    if (clientError) throw new Error(clientError.message);
    if (!client) throw new Error("Client introuvable.");
    if (!client.email) throw new Error("Ce client n'a pas d'adresse email.");

    const { data: artisan, error: artisanError } = await supabase
      .from("artisans")
      .select("nom_entreprise, email, email_contact, adresse, telephone, modele_message")
      .eq("id", client.artisan_id)
      .maybeSingle();

    if (artisanError) throw new Error(artisanError.message);
    if (!artisan) throw new Error("Fiche entreprise introuvable.");

    const corps = appliquerModele(
      artisan.modele_message,
      client.nom_client,
      client.type_equipement ?? "",
    );

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const resendKey = process.env["RESEND_API_KEY"];
    if (!lovableKey || !resendKey) {
      throw new Error("Le service d'envoi d'email n'est pas configuré.");
    }

    const emailContact = artisan.email_contact?.trim() || artisan.email;

    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">
      ${echapper(corps).replaceAll("\n", "<br />")}
      <p style="margin-top:24px;color:#6b7280;font-size:13px">
        ${echapper(artisan.nom_entreprise)}${artisan.telephone ? ` · ${echapper(artisan.telephone)}` : ""}
        ${artisan.adresse ? `<br />${echapper(artisan.adresse)}` : ""}
        <br />${echapper(emailContact)}
      </p>
    </div>`;

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: `${artisan.nom_entreprise} <onboarding@resend.dev>`,
        to: [client.email],
        reply_to: artisan.email,
        subject: `Entretien à prévoir — ${client.type_equipement || "votre équipement"}`,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Resend a refusé l'envoi [${response.status}]: ${body}`);
      throw new Error(`L'email n'a pas pu être envoyé [${response.status}]: ${body}`);
    }

    const { error: updateError } = await supabase
      .from("clients")
      .update({ statut_relance: "relance", derniere_relance_envoyee: new Date().toISOString() })
      .eq("id", client.id);

    if (updateError) throw new Error(updateError.message);

    return { ok: true as const, destinataire: client.email };
  });
