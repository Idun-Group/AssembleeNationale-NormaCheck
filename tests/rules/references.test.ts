import { describe, it, expect } from "vitest";
import { REFERENCES } from "@/lib/rules/references";

function detecte(id: string, texte: string) {
  const r = REFERENCES.find((x) => x.id === id)!;
  return r.detecteur!(texte);
}

describe("références et modifications", () => {
  it("R9.1-01 détecte les renvois relatifs", () => {
    expect(detecte("R9.1-01", "comme prévu à l'alinéa précédent").length).toBe(1);
    expect(detecte("R9.1-01", "mentionné à l'article suivant").length).toBe(1);
    expect(detecte("R9.1-01", "au deuxième alinéa")).toHaveLength(0);
  });
  it("R9.1-02 détecte ci-dessus / dispositions qui précèdent", () => {
    expect(detecte("R9.1-02", "les dispositions ci-dessus").length).toBe(1);
    expect(detecte("R9.1-02", "les dispositions qui précèdent").length).toBe(1);
  });
  it("R9.1-03 détecte les références imprécises aux dispositions", () => {
    expect(detecte("R9.1-03", "la présente disposition s'applique").length).toBe(1);
    expect(detecte("R9.1-03", "le présent article s'applique")).toHaveLength(0);
  });
  it("R8.1-01 détecte « Dans le … alinéa » comme point d'impact", () => {
    const r = detecte("R8.1-01", "Dans le premier alinéa de l'article 2, le mot est supprimé");
    expect(r.length).toBe(1);
    expect(r[0].suggestion).toBe("Au premier alinéa");
    expect(detecte("R8.1-01", "Au premier alinéa de l'article 2")).toHaveLength(0);
  });
  it("R8.1-01 conserve le pluriel du nom dans la suggestion", () => {
    const r = detecte("R8.1-01", "Dans les articles 2 et 3");
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].suggestion).toBe("Aux articles");
  });
  it("R8.3-01 : un alinéa/une phrase/des mots se SUPPRIMENT", () => {
    const r = detecte("R8.3-01", "Le deuxième alinéa est abrogé.");
    expect(r.length).toBe(1);
    expect(r[0].suggestion).toContain("supprimé");
    expect(detecte("R8.3-01", "Le deuxième alinéa est supprimé.")).toHaveLength(0);
  });
  it("R8.3-01 ne chevauche pas deux phrases (frontière de phrase après un point)", () => {
    expect(
      detecte(
        "R8.3-01",
        "Les mots sont ajoutés. Le chapitre est abrogé.",
      ).every((f) => !f.extrait.includes("ajoutés")),
    ).toBe(true);
  });
  it("R8.3-02 : un article/une division s'ABROGE", () => {
    const r = detecte("R8.3-02", "L'article L. 212-3 est supprimé.");
    expect(r.length).toBe(1);
    expect(r[0].suggestion).toContain("abrogé");
    expect(detecte("R8.3-02", "L'article L. 212-3 est abrogé.")).toHaveLength(0);
    expect(detecte("R8.3-02", "Les mots : « deux ans » sont supprimés.")).toHaveLength(0);
  });
  it("R8.3-02 traverse toujours l'abréviation « L. 212-3 »", () => {
    expect(detecte("R8.3-02", "L'article L. 212-3 est supprimé.").length).toBeGreaterThanOrEqual(1);
  });
  it("R8.3-02 ne chevauche pas deux phrases (frontière de phrase après un point)", () => {
    expect(
      detecte(
        "R8.3-02",
        "Le titre est modifié. L'article est supprimé.",
      ).every((f) => !f.extrait.includes("modifié")),
    ).toBe(true);
  });
});
