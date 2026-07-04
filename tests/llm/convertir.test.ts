import { describe, it, expect } from "vitest";
import { convertirFindingsLlm } from "@/lib/llm/convertir";

const texte = "Le rapport mentionné du même code est transmis.";

describe("convertirFindingsLlm", () => {
  it("ancre une citation exacte", () => {
    const f = convertirFindingsLlm(
      [{ ruleId: "RL-03", citation: "du même code", message: "Référence douteuse.", suggestion: null }],
      texte,
    );
    expect(f[0].span).toEqual({ start: 21, end: 33 });
    expect(f[0].source).toBe("llm");
    expect(f[0].severite).toBe("a_revoir");
  });
  it("garde le finding avec span null si citation introuvable", () => {
    const f = convertirFindingsLlm(
      [{ ruleId: "RL-03", citation: "citation inventée", message: "m", suggestion: null }],
      texte,
    );
    expect(f[0].span).toBeNull();
  });
  it("écarte les ruleId inconnus", () => {
    expect(convertirFindingsLlm(
      [{ ruleId: "R-INVENTÉ", citation: "du même code", message: "m", suggestion: null }],
      texte,
    )).toHaveLength(0);
  });
  it("ne produit jamais de sévérité enfreinte", () => {
    const f = convertirFindingsLlm(
      [{ ruleId: "RL-01", citation: "Le rapport", message: "m", suggestion: "s" }],
      texte,
    );
    expect(f[0].severite).not.toBe("enfreinte");
  });
});
