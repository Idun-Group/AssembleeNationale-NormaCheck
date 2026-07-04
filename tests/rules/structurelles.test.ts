import { describe, it, expect } from "vitest";
import { STRUCTURELLES } from "@/lib/rules/structurelles";

function detecte(id: string, texte: string) {
  const r = STRUCTURELLES.find((x) => x.id === id)!;
  return r.detecteur!(texte);
}

describe("règles structurelles §5/§6", () => {
  it("R5-01 : tiret manquant après I. / A.", () => {
    expect(detecte("R5-01", "I. L'article 2 est abrogé.").length).toBe(1);
    expect(detecte("R5-01", "A. L'article 3 est abrogé.").length).toBe(1);
    expect(detecte("R5-01", "I. – L'article 2 est abrogé.")).toHaveLength(0);
  });
  it("R5-01 : la civilité « M. » (Monsieur) n'est pas un marqueur de subdivision", () => {
    expect(detecte("R5-01", "M. Jean-Luc BOURGEAUX, M. Thibault BAZIN,")).toHaveLength(0);
    expect(detecte("R5-01", "M. Nicolas RAY, M. Jean-Pierre VIGIER,")).toHaveLength(0);
    // l'exclusion ne vise que le marqueur « M » : les autres lettres restent signalées
    expect(detecte("R5-01", "A. L'article 3 est abrogé.").length).toBe(1);
    expect(detecte("R5-01", "B. L'article 4 est abrogé.").length).toBe(1);
  });
  it("R5-02 : tiret indu après 1. / a.", () => {
    expect(detecte("R5-02", "1. – L'article 4 est abrogé.").length).toBe(1);
    expect(detecte("R5-02", "a. – Le premier alinéa est supprimé.").length).toBe(1);
    expect(detecte("R5-02", "1. L'article 4 est abrogé.")).toHaveLength(0);
  });
  it("R5-03 : minuscule en début de subdivision d'énumération", () => {
    expect(detecte("R5-03", "1° le deuxième alinéa est supprimé ;").length).toBe(1);
    expect(detecte("R5-03", "1° Le deuxième alinéa est supprimé ;")).toHaveLength(0);
    expect(detecte("R5-03", "– la première phrase ;")).toHaveLength(0); // tirets : minuscule OK
  });
  it("R5-04 : point-virgule manquant en fin d'élément d'énumération non final", () => {
    const texte = "1° Le deuxième alinéa est supprimé.\n2° Le troisième alinéa est supprimé.";
    const r = detecte("R5-04", texte);
    expect(r.length).toBe(1); // seule la 1re ligne fautive (la 2e clôt l'énumération)
    expect(detecte("R5-04", "1° Le deuxième alinéa est supprimé ;\n2° Le troisième alinéa est supprimé.")).toHaveLength(0);
  });
  it("R6-01 : ligne d'un bloc rédigé sans guillemet ouvrant", () => {
    const texte = [
      "L'article 2 est complété par deux alinéas ainsi rédigés :",
      "« Le premier alinéa est applicable.",
      "Le second alinéa est applicable. »",
    ].join("\n");
    const r = detecte("R6-01", texte);
    expect(r.length).toBe(1);
    expect(r[0].extrait).toContain("Le second alinéa");
  });
  it("R6-02 : guillemet fermant avant la fin du bloc rédigé", () => {
    const texte = [
      "L'article 2 est complété par deux alinéas ainsi rédigés :",
      "« Le premier alinéa est applicable. »",
      "« Le second alinéa est applicable. »",
    ].join("\n");
    expect(detecte("R6-02", texte).length).toBe(1);
    const ok = [
      "L'article 2 est complété par deux alinéas ainsi rédigés :",
      "« Le premier alinéa est applicable.",
      "« Le second alinéa est applicable. »",
    ].join("\n");
    expect(detecte("R6-02", ok)).toHaveLength(0);
  });

  it("R6-01 : deux blocs rédigés successifs, le second chapeau n'est pas avalé", () => {
    const deuxBlocs = [
      "L'article 2 est complété par un alinéa ainsi rédigé :",
      "« Le premier alinéa nouveau.",
      "L'article 3 est complété par un alinéa ainsi rédigé :",
      "« Le second alinéa nouveau. »",
    ].join("\n");
    const r = detecte("R6-01", deuxBlocs);
    expect(r.some((d) => d.extrait.includes("ainsi rédigé"))).toBe(false);
  });

  it("R6-02 : bloc clos, ligne vide, puis citation isolée non rattachée", () => {
    const blocPuisCitation = [
      "L'article 4 est complété par un alinéa ainsi rédigé :",
      "« Le nouvel alinéa est applicable. »",
      "",
      "« Une citation isolée dans un paragraphe distinct. »",
    ].join("\n");
    expect(detecte("R6-02", blocPuisCitation)).toHaveLength(0);
  });

  it("R6-01 : bloc clos suivi d'une ligne non citée hors bloc", () => {
    const blocPuisTexte = [
      "L'article 5 est complété par un alinéa ainsi rédigé :",
      "« Le nouvel alinéa. »",
      "Cette disposition entre en vigueur en 2027.",
    ].join("\n");
    expect(detecte("R6-01", blocPuisTexte)).toHaveLength(0);
  });
});
