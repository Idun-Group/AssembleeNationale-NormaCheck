import { describe, it, expect } from "vitest";
import { extraireJson } from "@/lib/llm/extraire-json";

describe("extraireJson", () => {
  it("parse du JSON nu", () => {
    expect(extraireJson('{"findings":[]}')).toEqual({ findings: [] });
  });
  it("parse du JSON dans un fence markdown", () => {
    expect(extraireJson('Voici :\n```json\n{"findings":[]}\n```')).toEqual({ findings: [] });
  });
  it("parse du JSON précédé de texte", () => {
    expect(extraireJson('Analyse terminée. {"findings":[{"ruleId":"RL-01","citation":"x","message":"m","suggestion":null}]}'))
      .toMatchObject({ findings: [{ ruleId: "RL-01" }] });
  });
  it("lève une erreur si aucun JSON", () => {
    expect(() => extraireJson("aucun objet ici")).toThrow();
  });
});
