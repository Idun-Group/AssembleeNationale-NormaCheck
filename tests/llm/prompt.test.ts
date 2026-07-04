import { describe, it, expect } from "vitest";
import { construirePrompt } from "@/lib/llm/prompt";

describe("construirePrompt", () => {
  const p = construirePrompt("Texte de démonstration à analyser.");
  it("liste toutes les règles LLM avec leur id", () => {
    for (const id of ["RL-01", "RL-02", "RL-03", "RL-04", "RL-05"]) expect(p).toContain(id);
  });
  it("exige des citations exactes et du JSON seul", () => {
    expect(p.toLowerCase()).toContain("verbatim");
    expect(p.toLowerCase()).toContain("uniquement");
    expect(p).toContain('"findings"');
  });
  it("contient le texte à analyser", () => {
    expect(p).toContain("Texte de démonstration");
  });
});
