import { describe, it, expect } from "vitest";
import { appliquerCorrection, appliquerToutes } from "@/lib/engine/corrections";
import { analyser } from "@/lib/engine/analyser";

describe("corrections", () => {
  it("applique une correction simple", () => {
    const texte = "le maire et/ou le préfet";
    const f = analyser(texte).find((x) => x.ruleId === "R9.2-01")!;
    expect(appliquerCorrection(texte, f)).toBe("le maire ou le préfet");
  });
  it("applique toutes les corrections sans corrompre les offsets", () => {
    const texte = "les collectivités locales et/ou l'Etat";
    const corrige = appliquerToutes(texte, analyser(texte));
    expect(corrige).toBe("les collectivités territoriales ou l'État");
  });
  it("après correction, une ré-analyse ne trouve plus les règles corrigées", () => {
    const texte = "le montant maximum et/ou le préfet";
    const corrige = appliquerToutes(texte, analyser(texte));
    const restants = analyser(corrige).filter((f) => f.suggestion);
    expect(restants).toHaveLength(0);
  });
});
