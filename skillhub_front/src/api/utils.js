// ========== utils.js : fonctions partagées pour les appels API ==========
// On centralise ici le parse des réponses et les messages d'erreur pour ne pas se répéter partout.

/**
 * Classe d'erreur HTTP typée.
 * Utilisée pour les throw dans les appels API au lieu d'objets littéraux.
 */
export class ApiError extends Error {
  constructor(status, data = {}) {
    super(data.message || "Erreur API");
    this.name = "ApiError";
    this.status = status;
    this.erreurs = data.erreurs ?? data.errors ?? null;
    this.errors = data.errors ?? null;
  }
}

/**
 * Parse le corps de la réponse en JSON.
 * On lit d'abord en texte pour éviter que response.json() plante si le serveur renvoie du HTML (ex. erreur 500).
 * Si le parse échoue, on retourne un objet avec un message pour que l'UI puisse quand même afficher une erreur.
 */
export async function parseJsonResponse(response) {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return {};
    return JSON.parse(text);
  } catch {
    return { message: "Réponse serveur invalide (non JSON)." };
  }
}

/**
 * À partir d'une erreur renvoyée par nos appels API (objet avec status, message, erreurs...),
 * on retourne un message lisible pour l'utilisateur.
 * 401 = session expirée, 403 = pas le droit, 422 = erreurs de validation (on affiche les champs).
 */
export function getMessageErreurApi(err, fallback = "Une erreur est survenue.") {
  if (!err) return fallback;
  const status = err.status;
  if (status === 401) return "Session expirée ou non authentifié. Veuillez vous reconnecter.";
  if (status === 403) return "Accès refusé. Droits insuffisants.";
  if (status === 404) return err.message || "Ressource introuvable.";
  if (status === 422) {
    const erreurs = err.erreurs || err.errors;
    if (erreurs && typeof erreurs === "object") {
      const list = Object.values(erreurs).flat().filter(Boolean);
      if (list.length) return list.join(" ");
    }
  }
  return err.message || fallback;
}
