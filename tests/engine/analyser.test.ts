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
