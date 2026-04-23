// ========== auth.js : authentification via microservice Spring Boot ==========
//
// ARCHITECTURE MICROSERVICES :
// Ce fichier ne parle plus à Laravel pour l'auth.
// Il parle directement au microservice Spring Boot Auth (port 8080 / /api/auth/*).
//
// SÉCURITÉ HMAC :
// Le mot de passe ne voyage JAMAIS sur le réseau.
// À la place on envoie un HMAC (empreinte cryptographique calculée avec le mot de passe).
// Si quelqu'un intercepte la requête, il ne peut pas récupérer le mot de passe.
//
// FLUX DE CONNEXION :
// 1. On demande un nonce (valeur unique) à Spring Boot
// 2. On calcule HMAC(mot_de_passe, email:nonce:timestamp) dans le navigateur
// 3. On envoie { email, nonce, timestamp, hmac } à Spring Boot
// 4. Spring Boot vérifie et renvoie le token SSO + rôle
//

import { parseJsonResponse, ApiError } from "./utils";

// URL du microservice Spring Boot Auth
// En développement Docker : /auth-api pointe vers :8080 via le proxy Vite
// En production : /api/auth/* redirigé par Nginx vers Spring Boot
const AUTH_URL = import.meta.env.VITE_AUTH_URL || "/auth-api";

/**
 * Calcule un HMAC-SHA256 en JavaScript natif (Web Crypto API).
 * Même algorithme que HmacService.java du TP5.
 *
 * @param {string} key     - La clé secrète (mot de passe de l'utilisateur)
 * @param {string} message - Le message à signer (email:nonce:timestamp)
 * @returns {string}       - Le HMAC en hexadécimal
 */
async function computeHmac(key, message) {
  // On encode la clé et le message en bytes (UTF-8)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(message);

  // On importe la clé dans le moteur crypto du navigateur
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,        // non exportable
    ["sign"]      // usage : signer seulement
  );

  // On calcule la signature HMAC
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);

  // On convertit le résultat (ArrayBuffer) en hexadécimal (comme Java HexFormat)
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const authApi = {

  /**
   * Inscription d'un nouvel utilisateur.
   * Envoie { email, password, nom, role } à Spring Boot.
   * Spring Boot chiffre le mot de passe en AES-GCM avant de le stocker.
   */
  async inscription(data) {
    const res = await fetch(`${AUTH_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:    data.email,
        password: data.mot_de_passe,   // On renomme mot_de_passe → password (attendu par Spring Boot)
        nom:      data.nom    ?? "",
        prenom:   data.prenom ?? "",
        role:     data.role   ?? "participant",
      }),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw new ApiError(res.status, json);
    return json;
  },

  /**
   * Connexion en 2 étapes avec HMAC.
   *
   * Étape 1 : On récupère un nonce unique auprès de Spring Boot.
   * Étape 2 : On calcule HMAC(mot_de_passe, email:nonce:timestamp) localement.
   * Étape 3 : On envoie { email, nonce, timestamp, hmac } — PAS le mot de passe.
   *
   * @param {{ email: string, mot_de_passe: string }} data
   */
  async connexion(data) {
    // ── Étape 1 : récupérer le nonce ─────────────────────────────────────
    const nonceRes = await fetch(`${AUTH_URL}/api/auth/nonce`);
    if (!nonceRes.ok) {
      throw new ApiError(503, { message: "Service d'authentification indisponible." });
    }
    const { nonce, timestamp } = await nonceRes.json();

    // ── Étape 2 : calculer le HMAC localement ────────────────────────────
    // message = "email:nonce:timestamp" (même format que AuthService.java)
    const message = `${data.email}:${nonce}:${timestamp}`;
    const hmac = await computeHmac(data.mot_de_passe, message);

    // ── Étape 3 : envoyer le HMAC (jamais le mot de passe) ───────────────
    const res = await fetch(`${AUTH_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:     data.email,
        nonce:     nonce,
        timestamp: String(timestamp),   // Spring Boot attend une String dans le Map
        hmac:      hmac,
      }),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw new ApiError(res.status, json);

    // Spring Boot renvoie { accessToken, role, nom, prenom, expiresAt }
    // On renomme accessToken → token pour garder la cohérence avec le reste du frontend
    return {
      token:       json.accessToken,
      utilisateur: {
        email:  data.email,
        role:   json.role   ?? "participant",
        nom:    json.nom    ?? "",
        prenom: json.prenom ?? "",
      },
    };
  },

  /**
   * Récupère les infos de l'utilisateur connecté depuis Spring Boot.
   * Utilisé par ProtectedRoute pour valider que la session est toujours active.
   */
  async me() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const res = await fetch(`${AUTH_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const json = await res.json();
    // On retourne l'objet utilisateur dans le même format qu'avant
    return {
      email:  json.email,
      role:   json.role   ?? "participant",
      nom:    json.nom    ?? "",
      prenom: json.prenom ?? "",
    };
  },

  /**
   * Déconnexion : on supprime le token localement.
   * (Spring Boot laisse le token expirer naturellement après 15 min)
   */
  async deconnexion() {
    this.removeToken();
    return { message: "Déconnexion réussie" };
  },

  // ── Gestion du token et de l'utilisateur en localStorage ─────────────

  getToken() {
    return localStorage.getItem("token");
  },

  setToken(token) {
    localStorage.setItem("token", token);
  },

  removeToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("utilisateur");
  },

  setUtilisateur(utilisateur) {
    if (utilisateur) {
      localStorage.setItem("utilisateur", JSON.stringify(utilisateur));
    } else {
      localStorage.removeItem("utilisateur");
    }
  },

  getUtilisateur() {
    const u = localStorage.getItem("utilisateur");
    return u ? JSON.parse(u) : null;
  },
};

