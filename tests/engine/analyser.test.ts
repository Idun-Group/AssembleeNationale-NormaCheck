import { describe, it, expect } from "vitest";
import { analyser } from "@/lib/engine/analyser";

describe("analyser", () => {
  const texte = "Dans le premier alinéa, les mots et/ou sont supprimés (par cohérence).";
  it("agrège les findings de toutes les règles, triés par position", () => {
    const f = analyser(texte);
    const ids = f.map((x) => x.ruleId);
    expect(ids).toContain("R8.1-01"); // Dans le premier alinéa
    expect(ids).toContain("R9.2-01"); // et/ou
    expect(ids).toContain("R7.2-01"); // parenthèses
    const starts = f.map((x) => x.span!.start);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });
  it("produit des findings complets", () => {
    const f = analyser(texte).find((x) => x.ruleId === "R9.2-01")!;
    expect(f.id).toBe(`R9.2-01:${f.span!.start}`);
    expect(f.severite).toBe("enfreinte");
    expect(f.source).toBe("regle");
    expect(f.message.length).toBeGreaterThan(5);
  });
  it("retourne [] sur un texte propre", () => {
    expect(analyser("Le maire transmet la liste au représentant de l'État dans le département.")).toEqual([]);
  });
});

describe("analyser — frontière exposé des motifs / dispositif", () => {
  const texte = [
    "EXPOSÉ DES MOTIFS",
    "",
    "Le présent texte vise à protéger l'environnement (et la biodiversité).",
    "",
    "Article 1er",
    "",
    "L'article L. 212-3 du code de l'environnement est supprimé.",
  ].join("\n");

  it("écarte les findings situés dans l'exposé des motifs", () => {
    const ids = analyser(texte).map((f) => f.ruleId);
    expect(ids).toContain("R8.3-02"); // faute du dispositif : conservée
    expect(ids).not.toContain("R7.2-01"); // parenthèse de l'exposé : écartée
  });

  it("ne gate rien en l'absence d'exposé des motifs", () => {
    const sansExpose = "Le texte vise à protéger (et la biodiversité).";
    expect(analyser(sansExpose).map((f) => f.ruleId)).toContain("R7.2-01");
  });
});
