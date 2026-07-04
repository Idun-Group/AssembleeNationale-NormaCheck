import { describe, it, expect } from "vitest";
import { calculerScore } from "@/lib/engine/score";
import { analyser } from "@/lib/engine/analyser";

describe("calculerScore", () => {
  it("donne 100 sans findings", () => {
    expect(calculerScore([], "Un texte parfaitement propre.").global).toBe(100);
  });
  it("baisse avec les findings et reste dans [0, 100]", () => {
    const texte = "les collectivités locales et/ou l'Etat (voire la CNIL)";
    const findings = analyser(texte);
    const s = calculerScore(findings, texte);
    expect(s.global).toBeLessThan(100);
    expect(s.global).toBeGreaterThanOrEqual(0);
    expect(s.parSeverite.enfreinte).toBeGreaterThan(0);
  });
  it("est normalisé : mêmes findings sur texte long -> score plus haut", () => {
    const texte = "et/ou";
    const long = "mot ".repeat(500) + "et/ou";
    const sCourt = calculerScore(analyser(texte), texte);
    const sLong = calculerScore(analyser(long), long);
    expect(sLong.global).toBeGreaterThan(sCourt.global);
  });
});
