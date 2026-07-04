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
