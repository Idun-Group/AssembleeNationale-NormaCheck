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
  it("ignore les accolades d'un préambule et extrait le vrai objet", () => {
    expect(extraireJson('Réponds au format {clé: valeur} : {"findings":[]}')).toEqual({ findings: [] });
  });
  it("ignore les accolades d'une note finale et extrait le vrai objet", () => {
    const result = extraireJson(
      '{"findings":[{"ruleId":"RL-01","citation":"x","message":"m","suggestion":null}]}\nNote: voir {annexe}.'
    ) as { findings: Array<{ ruleId: string }> };
    expect(result.findings[0].ruleId).toBe("RL-01");
  });
  it("ignore les accolades situées à l'intérieur d'une valeur de chaîne JSON", () => {
    const result = extraireJson(
      '{"findings":[{"ruleId":"RL-03","citation":"le mot { est cité","message":"m","suggestion":null}]}'
    ) as { findings: Array<{ citation: string }> };
    expect(result.findings[0].citation).toContain("{");
  });
});
