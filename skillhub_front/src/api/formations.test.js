import { describe, expect, it, vi } from "vitest";
import { formatFormationForDisplay, getImageUrl } from "./formations";

describe("getImageUrl", () => {
  it("retourne null quand la valeur est vide", () => {
    expect(getImageUrl("")).toBeNull();
    expect(getImageUrl(null)).toBeNull();
  });

  it("préfixe /storage avec le port Laravel local par défaut", () => {
    vi.stubGlobal("window", { location: { hostname: "localhost" } });
    expect(getImageUrl("/storage/formations/test.jpg")).toBe("http://localhost:8000/storage/formations/test.jpg");
    vi.unstubAllGlobals();
  });

  it("laisse intact un chemin qui ne commence pas par /storage", () => {
    expect(getImageUrl("/images/logo.png")).toBe("/images/logo.png");
  });

  it("convertit une URL absolue backend en URL locale stable", () => {
    vi.stubGlobal("window", { location: { hostname: "127.0.0.1" } });
    expect(getImageUrl("http://localhost:8000/storage/formations/a.jpg")).toBe(
      "http://127.0.0.1:8000/storage/formations/a.jpg"
    );
    vi.unstubAllGlobals();
  });
});

describe("formatFormationForDisplay", () => {
  it("retourne null si la formation est absente", () => {
    expect(formatFormationForDisplay(null)).toBeNull();
  });

  it("mappe les champs clés pour l'affichage catalogue", () => {
    vi.stubGlobal("window", { location: { hostname: "localhost" } });
    const input = {
      id: 10,
      nom: "React avancé",
      description: "Formation complète",
      duree_heures: 12,
      level: "advanced",
      image_url: "/storage/formations/react.jpg",
      created_at: "2026-04-17T00:00:00.000Z",
      formateur: { prenom: "Steve", nom: "Ravalomanana" },
      categorie: { libelle: "Développement web" },
    };

    const output = formatFormationForDisplay(input);

    expect(output.formateur).toBe("Steve Ravalomanana");
    expect(output.domaine).toBe("Développement web");
    expect(output.heures).toBe(12);
    expect(output.levelLabel).toBe("Avancé");
    expect(output.image_url).toBe("http://localhost:8000/storage/formations/react.jpg");
    expect(output.date).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    vi.unstubAllGlobals();
  });
});
