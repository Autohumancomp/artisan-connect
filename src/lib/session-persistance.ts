/**
 * Gère l'option « Rester connecté » du formulaire de connexion.
 *
 * Si l'artisan ne coche pas la case, la session est considérée comme valable
 * uniquement pour l'onglet en cours : à la fermeture du navigateur, le marqueur
 * de session disparaît et l'application le déconnecte au prochain chargement.
 */
const CLE_PERSISTANCE = "fidel_rester_connecte";
const CLE_ONGLET = "fidel_session_onglet";

export function memoriserChoixSession(resterConnecte: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLE_PERSISTANCE, resterConnecte ? "oui" : "non");
  window.sessionStorage.setItem(CLE_ONGLET, "actif");
}

/** true si la session doit être abandonnée (navigateur fermé entre-temps). */
export function sessionExpiree(): boolean {
  if (typeof window === "undefined") return false;
  const resterConnecte = window.localStorage.getItem(CLE_PERSISTANCE) !== "non";
  if (resterConnecte) return false;
  return window.sessionStorage.getItem(CLE_ONGLET) !== "actif";
}

export function oublierChoixSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLE_PERSISTANCE);
  window.sessionStorage.removeItem(CLE_ONGLET);
}
