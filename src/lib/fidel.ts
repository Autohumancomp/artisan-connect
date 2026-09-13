export type StatutRelance = "a_venir" | "a_relancer" | "relance";
export type StatutAbonnement = "essai" | "actif" | "suspendu";
export type Priorite = "haute" | "moyenne" | "basse";

export interface ClientRow {
  id: string;
  artisan_id: string;
  nom_client: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  type_equipement: string | null;
  date_dernier_entretien: string | null;
  frequence_relance_mois: number;
  date_prochaine_relance: string | null;
  statut_relance: StatutRelance;
  notes: string | null;
  derniere_relance_envoyee: string | null;
}

export interface ArtisanRow {
  id: string;
  user_id: string | null;
  nom_entreprise: string;
  email: string;
  email_contact: string | null;
  adresse: string | null;
  telephone: string | null;
  modele_message: string;
  statut_abonnement: StatutAbonnement;
  frequence_relance_defaut: number;
}

export interface HistoriqueRelanceRow {
  id: string;
  client_id: string;
  artisan_id: string;
  destinataire: string | null;
  statut: string;
  erreur: string | null;
  envoye_le: string;
}

export const STATUT_LABELS: Record<StatutRelance, string> = {
  a_venir: "À venir",
  a_relancer: "À relancer",
  relance: "Relancé",
};

export const PRIORITE_LABELS: Record<Priorite, string> = {
  haute: "Haute",
  moyenne: "Moyenne",
  basse: "Basse",
};

/** Nombre de jours entre aujourd'hui et la date donnée (négatif = en retard). */
export function joursRestants(date: string | null): number | null {
  if (!date) return null;
  const cible = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((cible.getTime() - today.getTime()) / 86_400_000);
}

export function prioriteDe(date: string | null): Priorite | null {
  const j = joursRestants(date);
  if (j === null) return null;
  if (j < 15) return "haute";
  if (j <= 30) return "moyenne";
  return "basse";
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateHeure(valeur: string | null): string {
  if (!valeur) return "—";
  return new Date(valeur).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
}

export function appliquerModele(modele: string, nomClient: string, equipement: string): string {
  return modele
    .replaceAll("{{nom_client}}", nomClient)
    .replaceAll("{{equipement}}", equipement || "votre équipement");
}
