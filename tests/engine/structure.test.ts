import { describe, it, expect } from "vitest";
import { decouperLignes, classifierLigne } from "@/lib/engine/structure";

describe("decouperLignes", () => {
  it("découpe avec offsets absolus", () => {
    const l = decouperLignes("abc\ndef\n\nghi");
    expect(l).toHaveLength(4);
    expect(l[1]).toEqual({ texte: "def", start: 4, end: 7 });
    expect(l[3]).toEqual({ texte: "ghi", start: 9, end: 12 });
  });
});

describe("classifierLigne", () => {
  const cas: Array<[string, string, boolean | undefined]> = [
    ["I. – L'article 2 est abrogé.", "paragraphe_romain", true],
    ["II. L'article 3 est abrogé.", "paragraphe_romain", false],
    ["A. – L'article 4 est abrogé.", "lettre_maj", true],
    ["1. L'article 5 est abrogé.", "numero", false],
    ["1. – L'article 5 est abrogé.", "numero", true],
    ["a. Le premier alinéa est supprimé.", "lettre_min", false],
    ["1° Le deuxième alinéa est supprimé ;", "enum_degre", undefined],
    ["a) La première phrase est supprimée ;", "enum_lettre", undefined],
    ["– la première phrase ;", "tiret", undefined],
    ["« Art. L. 312-5. – Le dépôt s'effectue à la mairie. »", "alinea_redige", undefined],
    ["L'article L. 313-1 est complété par un alinéa ainsi rédigé :", "chapeau_redige", undefined],
    ["Le Gouvernement remet un rapport.", "autre", undefined],
  ];
  for (const [texte, type, avecTiret] of cas) {
    it(`classe « ${texte.slice(0, 30)}… » comme ${type}`, () => {
      const c = classifierLigne({ texte, start: 0, end: texte.length });
      expect(c.type).toBe(type);
      if (avecTiret !== undefined) expect(c.avecTiret).toBe(avecTiret);
    });
  }
});
