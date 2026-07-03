import { describe, it, expect } from "vitest";
import { FORMULES_STANDARD } from "@/lib/rules/formules-standard";

function detecte(id: string, texte: string) {
  const r = FORMULES_STANDARD.find((x) => x.id === id)!;
  return r.detecteur!(texte);
}

const CAS: Array<[id: string, ko: string, suggestion: string | undefined, ok: string]> = [
  ["R9.2-01", "le juge et/ou le procureur", "ou", "le juge ou le procureur"],
  ["R9.2-02", "le droit communautaire", "européen", "la communauté de communes"],
  ["R9.2-03", "le montant maximum de l'aide", "montant maximal", "le montant maximal"],
  ["R9.2-04", "le décret visé à l'article 3", "mentionné à", "le décret mentionné à l'article 3"],
  ["R9.2-05", "prévu par l'article 20", "prévu à l'article", "prévu à l'article 20"],
  ["R9.2-06", "le ministre en charge des sports", "ministre chargé des sports", "le ministre chargé des sports"],
  ["R9.2-07", "dans les conditions fixées par décret", "dans des conditions fixées par décret", "dans des conditions fixées par décret"],
  ["R9.2-08", "les collectivités locales", "collectivités territoriales", "les collectivités territoriales"],
  ["R9.2-09", "lettre avec accusé de réception", "lettre avec demande d'avis de réception", "avis de réception"],
  ["R9.2-10", "conformément à l'article L. 3 du code civil", "en application de l'article", "conformément à l'article 13 de la Constitution"],
  ["R9.2-11", "le ou les représentants", "les", "les représentants"],
  ["R9.2-12", "au Journal officiel de la République française", "Journal officiel", "au Journal officiel"],
  ["R9.2-14", "fixée par un décret en Conseil d'État", "par décret en Conseil d'État", "fixée par décret en Conseil d'État"],
  ["R9.2-15", "les projets de lois de finances", "projets de loi de finances", "les projets de loi de finances"],
  ["R9.2-16", "la loi de finances initiale", "loi de finances de l'année", "la loi de finances de l'année"],
  ["R9.2-17", "le garde des sceaux, ministre de la justice", "ministre de la justice", "le ministre de la justice"],
  ["R9.2-18", "l'annexe du livre Ier", "annexe au livre", "l'annexe au livre Ier"],
];

describe("formules standard §9.2", () => {
  for (const [id, ko, suggestion, ok] of CAS) {
    it(`${id} détecte le cas fautif`, () => {
      const r = detecte(id, ko);
      expect(r.length).toBeGreaterThan(0);
      if (suggestion) expect(r[0].suggestion).toContain(suggestion.split(" ")[0]);
    });
    it(`${id} ignore le cas correct`, () => {
      expect(detecte(id, ok)).toHaveLength(0);
    });
  }
  it("R9.2-02 ne matche pas à l'intérieur d'un mot", () => {
    expect(detecte("R9.2-02", "les communautés urbaines")).toHaveLength(0);
  });
  it("R9.2-13 préfet -> représentant de l'État", () => {
    expect(detecte("R9.2-13", "le préfet du département")[0].suggestion)
      .toBe("représentant de l'État dans le département");
    expect(detecte("R9.2-13", "la préfecture")).toHaveLength(0);
  });

  describe("R9.2-03 ne doit pas capturer l'idiome « au maximum »", () => {
    it("ignore « au maximum » (idiome, nom correct)", () => {
      expect(detecte("R9.2-03", "il perçoit la somme au maximum")).toHaveLength(0);
    });
    it("ignore « le maximum autorisé »", () => {
      expect(detecte("R9.2-03", "le maximum autorisé")).toHaveLength(0);
    });
    it("détecte toujours l'emploi adjectival « délai maximum »", () => {
      expect(detecte("R9.2-03", "un délai maximum de trois mois").length).toBeGreaterThanOrEqual(1);
    });
    it("détecte toujours « montant maximum »", () => {
      expect(detecte("R9.2-03", "le montant maximum de l'aide").length).toBeGreaterThanOrEqual(1);
    });
  });
});
