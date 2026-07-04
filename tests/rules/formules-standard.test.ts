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
  ["R9.2-20", "Le Gouvernement présente au Parlement un rapport sur l'application de la présente loi.", "remet", "Le Gouvernement remet au Parlement un rapport sur l'application de la présente loi."],
  ["R9.2-21", "La présente loi entre en vigueur six mois après sa publication.", "promulgation", "La présente loi entre en vigueur six mois après sa promulgation."],
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
  it("R9.2-11 détecte « Le ou les » en début de phrase (majuscule)", () => {
    const r = detecte("R9.2-11", "Le ou les dirigeants tiennent les pièces à disposition.");
    expect(r.length).toBe(1);
    expect(r[0].suggestion).toBe("Les");
  });
  it("R9.2-13 ignore « sous-préfet »", () => {
    expect(detecte("R9.2-13", "le sous-préfet de l'arrondissement")).toHaveLength(0);
  });
  it("R9.2-13 continue de détecter « le préfet » seul", () => {
    expect(detecte("R9.2-13", "le préfet du département")).toHaveLength(1);
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

  describe("R9.2-19 — entrée en vigueur", () => {
    it("signale « à la date du <date> » et suggère « à compter du »", () => {
      const r = detecte("R9.2-19", "La présente loi entre en vigueur à la date du 1er janvier 2027.");
      expect(r.length).toBe(1);
      expect(r[0].suggestion).toBe("à compter du ");
    });
    it("signale aussi « à la date <date> » sans « du »", () => {
      expect(detecte("R9.2-19", "applicable à la date 15 mars 2026").length).toBe(1);
    });
    it("n'atteint pas « à la date de publication » ni « à la date d'entrée en vigueur »", () => {
      expect(detecte("R9.2-19", "à la date de publication de la loi")).toHaveLength(0);
      expect(detecte("R9.2-19", "à la date d'entrée en vigueur du décret")).toHaveLength(0);
    });
  });

  describe("R9.2-20 — « présente au Parlement un rapport » → « remet »", () => {
    it("ignore « présente au Parlement » sans rapport", () => {
      expect(detecte("R9.2-20", "Le Gouvernement présente au Parlement ses observations.")).toHaveLength(0);
    });
    it("accorde la suggestion au pluriel", () => {
      const r = detecte("R9.2-20", "Les ministres présentent au Parlement un rapport annuel.");
      expect(r.length).toBe(1);
      expect(r[0].suggestion).toBe("remettent");
    });
  });

  describe("R9.2-21 — entrée en vigueur différée : promulgation, pas publication", () => {
    it("détecte « le premier jour du sixième mois suivant la publication »", () => {
      const r = detecte(
        "R9.2-21",
        "Les articles 2 et 3 entrent en vigueur le premier jour du sixième mois suivant la publication de la présente loi.",
      );
      expect(r.length).toBe(1);
      expect(r[0].suggestion).toContain("promulgation");
    });
    it("n'atteint pas l'entrée en vigueur immédiate « à la date de sa publication »", () => {
      expect(
        detecte("R9.2-21", "La présente loi entre en vigueur à la date de sa publication."),
      ).toHaveLength(0);
    });
    it("n'atteint pas une formule transitoire se référant à la publication", () => {
      expect(
        detecte(
          "R9.2-21",
          "Les contrats conclus avant la publication de la présente loi demeurent régis par les dispositions antérieures.",
        ),
      ).toHaveLength(0);
    });
    it("ne franchit pas une frontière de phrase", () => {
      expect(
        detecte(
          "R9.2-21",
          "La présente loi entre en vigueur immédiatement. Les modalités de publication des annonces sont fixées six mois après la promulgation.",
        ),
      ).toHaveLength(0);
    });
  });
});
