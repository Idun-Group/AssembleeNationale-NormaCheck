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
  it("R5-01 : « L. »/« R. »/« D. » suivi d'un numéro est une référence d'article, pas une subdivision", () => {
    // cas typique d'un PDF qui coupe « …de l'article L. 228 » en fin de ligne
    expect(detecte("R5-01", "L. 228 du code électoral est abrogé.")).toHaveLength(0);
    expect(detecte("R5-01", "R. 512-1 est ainsi rédigé :")).toHaveLength(0);
    expect(detecte("R5-01", "D. 4 du code de la route.")).toHaveLength(0);
    // une vraie subdivision « A. » reste signalée
    expect(detecte("R5-01", "A. L'article 3 est abrogé.").length).toBe(1);
  });
  it("R5-05 : numérotation en double dans une série contiguë", () => {
    const texte = "I. – Premier.\nII. – Deuxième.\nII. – Encore deux.\nIV. – Quatrième.";
    const r = detecte("R5-05", texte);
    expect(r.length).toBe(1);
    expect(r[0].extrait).toBe("II");
  });
  it("R5-05 : deux énumérations séparées (ligne vide ou article) ne sont pas des doublons", () => {
    // restart d'énumération après une ligne vide
    expect(detecte("R5-05", "1° A ;\n2° B.\n\n1° C ;\n2° D.")).toHaveLength(0);
    // restart après un nouvel article
    expect(
      detecte("R5-05", "Article 1er\n1° A ;\n2° B.\nArticle 2\n1° C ;\n2° D."),
    ).toHaveLength(0);
    // une séquence saine ne déclenche rien
    expect(detecte("R5-05", "1° A ;\n2° B ;\n3° C.")).toHaveLength(0);
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
  it("R5-03 / R5-05 : la plage « 1° à 3° (Supprimés) » n'est pas signalée", () => {
    expect(detecte("R5-03", "1° à 3° (Supprimés)")).toHaveLength(0); // « à » = plage, pas minuscule
    expect(detecte("R5-05", "1° à 3° (Supprimés)")).toHaveLength(0);
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
  it("R6-01 : les instructions imbriquées (« 1° … », lignes en « : ») ne sont pas des alinéas rédigés", () => {
    const texte = [
      "L'article L. 3 du code est ainsi modifié :",
      "1° Le premier alinéa est complété par les mots : « et suivants » ;",
      "2° Il est ajouté un alinéa ainsi rédigé :",
      "« Le nouvel alinéa est applicable. »",
    ].join("\n");
    // « 1° … » et « 2° … » sont des instructions de modification, pas des
    // alinéas rédigés : aucun faux R6-01 ne doit être produit.
    expect(detecte("R6-01", texte)).toHaveLength(0);
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
