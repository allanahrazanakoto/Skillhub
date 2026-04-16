// Appels API formations + catégories (JWT dans les headers quand il y a un token).

import { parseJsonResponse } from "./utils";
import { API_ORIGIN, API_URL } from "../constants";

/** URL du serveur Laravel (sans /api), pour les images /storage — ex. http://localhost:8000 */
function laravelBaseUrl() {
  if (API_ORIGIN) return API_ORIGIN;
  const viteApi = import.meta.env.VITE_API_URL || "";
  if (viteApi.startsWith("http")) {
    try {
      return new URL(viteApi).origin;
    } catch {
      return "";
    }
  }
  if (typeof window === "undefined") return "";
  const { hostname } = window.location;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") return "";
  const port = import.meta.env.VITE_LARAVEL_PORT || "8000";
  return `http://${hostname}:${port}`;
}

/**
 * URL pour <img src>. L’API peut envoyer une URL complète ou /storage/…
 * On n’utilise que le chemin puis on préfixe avec laravelBaseUrl() (sinon chemin relatif → proxy Vite).
 */
export function getImageUrl(imageUrl) {
  if (imageUrl == null || String(imageUrl).trim() === "") return null;
  let path = String(imageUrl).trim().replace(/\\/g, "/");
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      path = new URL(path).pathname;
    } catch {
      return null;
    }
  }
  if (!path.startsWith("/")) path = `/${path}`;
  if (!path.startsWith("/storage")) return path;
  const base = laravelBaseUrl();
  return base ? `${base}${path}` : path;
}

function getAuthHeaders(json = true) {
  const token = localStorage.getItem("token");
  const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

export const formationsApi = {
  async getFormations(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${API_URL}/formations${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return { formations: json.formations ?? [], meta: json.meta ?? null };
  },

  async getFormationsCatalogue(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${API_URL}/formations${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return { formations: json.formations ?? [], meta: json.meta ?? null };
  },

  async getFormation(id) {
    const res = await fetch(`${API_URL}/formations/${id}`, { headers: getAuthHeaders() });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return json.formation;
  },

  async getModules(formationId) {
    const res = await fetch(`${API_URL}/formations/${formationId}/modules`, {
      headers: getAuthHeaders(),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return json.modules ?? [];
  },

  async createModule(formationId, data) {
    const res = await fetch(`${API_URL}/formations/${formationId}/modules`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return json.module;
  },

  async updateModule(moduleId, data) {
    const res = await fetch(`${API_URL}/modules/${moduleId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return json.module;
  },

  async deleteModule(moduleId) {
    const res = await fetch(`${API_URL}/modules/${moduleId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return json;
  },

  async updateModuleCompletion(formationId, moduleId, estFait) {
    const res = await fetch(`${API_URL}/formations/${formationId}/modules/${moduleId}/completion`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ est_fait: !!estFait }),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return { module: json.module, progression: json.progression };
  },

  async createFormation(data) {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_URL}/formations`, {
      method: "POST",
      headers: getAuthHeaders(!isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return json.formation;
  },

  async updateFormation(id, data) {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_URL}/formations/${id}`, {
      method: isFormData ? "POST" : "PUT",
      headers: getAuthHeaders(!isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return json.formation;
  },

  async deleteFormation(id) {
    const res = await fetch(`${API_URL}/formations/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return json;
  },

  async getCategories() {
    const res = await fetch(`${API_URL}/categories`);
    const json = await parseJsonResponse(res);
    if (!res.ok) throw { status: res.status, ...json };
    return json.categories;
  },
};

const LEVEL_LABELS = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" };

export function formatFormationForDisplay(f) {
  if (!f) return null;
  const formateurNom = f.formateur
    ? [f.formateur.prenom, f.formateur.nom].filter(Boolean).join(" ")
    : "";
  const dateStr = f.created_at ? new Date(f.created_at).toLocaleDateString("fr-FR") : "";
  return {
    ...f,
    formateur: formateurNom,
    domaine: f.categorie?.libelle || "",
    heures: f.duree_heures,
    date: dateStr,
    description: f.description || "",
    level: f.level || "",
    levelLabel: LEVEL_LABELS[f.level] || f.level || "",
    image_url: getImageUrl(f.image_url) ?? f.image_url,
  };
}

export function formatAtelierForCarte(f) {
  if (!f) return null;
  const statutMap = { "En Cours": "en-cours", Terminé: "termine", "À venir": "a-venir" };
  const dateStr = f.created_at ? new Date(f.created_at).toLocaleDateString("fr-FR") : "";
  return {
    id: f.id,
    titre: f.nom,
    date: dateStr,
    statut: statutMap[f.statut] || "en-cours",
    statutLabel: f.statut || "En cours",
  };
}
