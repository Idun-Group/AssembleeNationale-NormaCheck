import { describe, it, expect } from "vitest";
import { COHERENCE } from "@/lib/rules/coherence";

function detecte(id: string, texte: string) {
  const r = COHERENCE.find((x) => x.id === id)!;
  return r.detecteur!(texte);
}

describe("RT-01 — injonction au Gouvernement (PPL-PAR-SEP-001)", () => {
  it("détecte l'injonction canonique de dépôt d'un projet de loi", () => {
    const r = detecte(
      "RT-01",
      "Le Gouvernement dépose au Parlement, avant le 1er janvier 2027, un projet de loi visant à réformer le régime des retraites.",
    );
    expect(r.length).toBe(1);
    expect(r[0].message).toMatch(/injonction/i);
  });
  it("détecte « est tenu de déposer un projet de loi »", () => {
    expect(
      detecte("RT-01", "Le Gouvernement est tenu de déposer un projet de loi relatif à la santé."),
    ).toHaveLength(1);
  });
  it("ignore la demande de rapport (pas un projet de loi)", () => {
    expect(
      detecte(
        "RT-01",
        "Le Gouvernement remet au Parlement un rapport sur l'application de la présente loi avant le 1er janvier 2027.",
      ),
    ).toHaveLength(0);
  });
  it("ignore le projet de loi de ratification (formule d'habilitation standard, voix active)", () => {
    expect(
      detecte(
        "RT-01",
        "Le Gouvernement dépose un projet de loi de ratification dans un délai de trois mois à compter de la publication de l'ordonnance.",
      ),
    ).toHaveLength(0);
  });
  it("ignore la formule passive de ratification", () => {
    expect(
      detecte(
        "RT-01",
        "Un projet de loi de ratification est déposé devant le Parlement dans un délai de trois mois.",
      ),
    ).toHaveLength(0);
  });
  it("ignore le rapport annexé au projet de loi de finances", () => {
    expect(
      detecte(
        "RT-01",
        "Le Gouvernement présente chaque année, en annexe au projet de loi de finances, un rapport sur les dépenses fiscales.",
      ),
    ).toHaveLength(0);
  });
});

describe("RT-02 — rapport au Parlement sans délai de remise (PPL-MAT-NOR-018)", () => {
  it("détecte la demande de rapport sans délai", () => {
    const r = detecte(
      "RT-02",
      "Le Gouvernement remet au Parlement un rapport sur l'application de la présente loi.",
    );
    expect(r.length).toBe(1);
    expect(r[0].message).toContain("délai");
  });
  it("ignore la demande assortie d'un délai (« dans un délai de six mois »)", () => {
    expect(
      detecte(
        "RT-02",
        "Le Gouvernement remet au Parlement, dans un délai de six mois à compter de la promulgation de la présente loi, un rapport sur son application.",
      ),
    ).toHaveLength(0);
  });
  it("ignore la demande assortie d'une échéance (« avant le 1er janvier 2027 »)", () => {
    expect(
      detecte(
        "RT-02",
        "Le Gouvernement transmet au Parlement, avant le 1er janvier 2027, un rapport d'évaluation du dispositif.",
      ),
    ).toHaveLength(0);
  });
  it("laisse le rapport périodique à RT-03", () => {
    expect(
      detecte(
        "RT-02",
        "Le Gouvernement remet chaque année au Parlement un rapport sur la mise en œuvre du dispositif.",
      ),
    ).toHaveLength(0);
  });
  it("ignore un rapport qui n'est pas destiné au Parlement", () => {
    expect(
      detecte("RT-02", "La commission présente un rapport au conseil d'administration."),
    ).toHaveLength(0);
  });
  it("ignore la simple transmission d'un rapport existant (voix passive)", () => {
    expect(
      detecte("RT-02", "Le rapport mentionné à l'article 2 est transmis au Parlement."),
    ).toHaveLength(0);
  });
});

describe("RT-03 — rapport périodique sans durée : caducité (PPL-MAT-NOR-031)", () => {
  it("détecte le rapport annuel sans limitation de durée", () => {
    const r = detecte(
      "RT-03",
      "Le Gouvernement remet chaque année au Parlement un rapport sur la mise en œuvre de la présente loi.",
    );
    expect(r.length).toBe(1);
    expect(r[0].message).toContain("durée");
  });
  it("détecte aussi la périodicité exprimée par « tous les deux ans »", () => {
    expect(
      detecte(
        "RT-03",
        "Le Gouvernement adresse tous les deux ans au Parlement un rapport d'évaluation.",
      ),
    ).toHaveLength(1);
  });
  it("ignore le rapport périodique borné dans le temps", () => {
    expect(
      detecte(
        "RT-03",
        "Le Gouvernement remet chaque année au Parlement, pendant une durée de cinq ans, un rapport sur la mise en œuvre de la présente loi.",
      ),
    ).toHaveLength(0);
  });
  it("ignore le rapport ponctuel (affaire de RT-02)", () => {
    expect(
      detecte(
        "RT-03",
        "Le Gouvernement remet au Parlement un rapport sur l'application de la présente loi.",
      ),
    ).toHaveLength(0);
  });
  it("ignore un rapport périodique qui n'est pas destiné au Parlement", () => {
    expect(
      detecte("RT-03", "Chaque année, l'agence publie un rapport d'activité."),
    ).toHaveLength(0);
  });
});
