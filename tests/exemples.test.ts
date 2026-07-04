import { describe, it, expect } from "vitest";
import { EXEMPLES } from "@/data/exemples";
import { analyser } from "@/lib/engine/analyser";

describe("golden tests des exemples", () => {
  for (const ex of EXEMPLES) {
    it(`${ex.id} déclenche exactement les familles attendues`, () => {
      const detectes = new Set(analyser(ex.texte).map((f) => f.ruleId));
      for (const attendu of ex.reglesAttendues) {
        expect(detectes, `règle ${attendu} attendue dans ${ex.id}`).toContain(attendu);
      }
    });
  }
  it("l'exemple llm est quasi vierge en déterministe", () => {
    const ex = EXEMPLES.find((e) => e.id === "llm")!;
    expect(analyser(ex.texte).filter((f) => f.severite === "enfreinte").length).toBeLessThanOrEqual(1);
  });
});
