import { describe, it, expect } from "vitest";
import { REGLES, FAMILLES, regleParId } from "@/lib/rules";

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
  it("toute famille de règle est répertoriée dans FAMILLES (sinon invisible au glossaire)", () => {
    for (const r of REGLES) {
      expect(FAMILLES, `famille « ${r.famille} » de ${r.id}`).toContain(r.famille);
    }
  });
  it("le catalogue comporte les règles issues de la taxonomie PPL (tier 1 + 2)", () => {
    for (const id of ["RT-01", "RT-02", "RT-03", "R9.2-20", "R9.2-21", "RL-06", "RL-07", "RL-08", "RL-09", "RL-10"]) {
      expect(regleParId(id), id).toBeDefined();
    }
  });
});
