import { describe, it, expect } from "vitest";
import { ancrer, fusionner, chevauche } from "@/lib/engine/fusion";
import type { Finding } from "@/lib/rules/types";

const f = (o: Partial<Finding>): Finding => ({
  id: "x", ruleId: "R", span: { start: 0, end: 5 }, extrait: "", message: "",
  severite: "enfreinte", source: "regle", ...o,
});

describe("ancrer", () => {
  it("retrouve l'offset d'une citation exacte", () => {
    expect(ancrer("et/ou", "choix et/ou option")).toEqual({ start: 6, end: 11 });
  });
  it("retourne null si introuvable", () => {
    expect(ancrer("absent", "texte")).toBeNull();
  });
  it("tolère une apostrophe droite là où le texte a une apostrophe typographique", () => {
    const texte = "Après le 22° de l’article L. 161-37, il est inséré un alinéa.";
    // le LLM cite avec une apostrophe droite '
    const span = ancrer("de l'article L. 161-37", texte)!;
    expect(span).not.toBeNull();
    expect(texte.slice(span.start, span.end)).toBe("de l’article L. 161-37");
  });
  it("tolère un saut de ligne PDF là où la citation a une espace", () => {
    const texte = "il est inséré\nun article L. 5121-8-3 ainsi rédigé";
    const span = ancrer("il est inséré un article L. 5121-8-3", texte)!;
    expect(span).not.toBeNull();
    expect(texte.slice(span.start, span.end)).toBe("il est inséré\nun article L. 5121-8-3");
  });
});

describe("fusionner", () => {
  it("écarte le finding LLM qui chevauche un déterministe", () => {
    const det = [f({ id: "d1", span: { start: 10, end: 20 } })];
    const llm = [
      f({ id: "l1", source: "llm", severite: "a_revoir", span: { start: 15, end: 25 } }),
      f({ id: "l2", source: "llm", severite: "a_revoir", span: { start: 40, end: 45 } }),
    ];
    const r = fusionner(det, llm);
    expect(r.map((x) => x.id)).toEqual(["d1", "l2"]);
  });
  it("garde les findings LLM non ancrés (span null) en fin de liste", () => {
    const r = fusionner([f({ id: "d1" })], [f({ id: "l1", source: "llm", span: null })]);
    expect(r[r.length - 1].id).toBe("l1");
  });
});

describe("chevauche", () => {
  it("détecte le chevauchement", () => {
    expect(chevauche({ start: 0, end: 5 }, { start: 4, end: 8 })).toBe(true);
    expect(chevauche({ start: 0, end: 5 }, { start: 5, end: 8 })).toBe(false);
  });
});
