import { describe, it, expect } from "vitest";
import { REGLES, regleParId } from "@/lib/rules";

describe("catalogue de règles", () => {
  it("a des ids uniques", () => {
    const ids = REGLES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("chaque règle a titre, explication, exemples et ref", () => {
    for (const r of REGLES) {
      expect(r.titre.length).toBeGreaterThan(3);
      expect(r.explication.length).toBeGreaterThan(10);
      expect(r.ref).toMatch(/^§/);
      expect(r.exempleOk.length).toBeGreaterThan(0);
      expect(r.exempleKo.length).toBeGreaterThan(0);
    }
  });
  it("regleParId retrouve une règle", () => {
    if (REGLES.length === 0) return; // catalogue rempli à partir de la tâche 3
    expect(regleParId(REGLES[0].id)?.id).toBe(REGLES[0].id);
  });
  it("toute règle sans détecteur a une instruction llm", () => {
    for (const r of REGLES) {
      if (!r.detecteur) expect(r.llm, r.id).toBeTruthy();
    }
  });
});
