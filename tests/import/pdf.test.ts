import { describe, it, expect } from "vitest";
import { nettoyerPdf, deWrapper } from "@/lib/import/pdf";
import { analyser } from "@/lib/engine/analyser";

describe("nettoyerPdf — strip des glyphes de zone privée (PUA)", () => {
  it("retire les glyphes de gouttière de numérotation (U+F04C…)", () => {
    const avant = "\uF04CLe texte reste.";
    expect(nettoyerPdf(avant)).toBe("Le texte reste.");
  });
  it("retire les lignes de numéro de page « - 9 - »", () => {
    const t = "Première ligne.\n- 9 -\nSuite du texte.";
    expect(nettoyerPdf(t)).not.toContain("- 9 -");
  });
});

describe("deWrapper — recolle les lignes wrappées par le PDF en alinéas logiques", () => {
  it("recolle une continuation en minuscule", () => {
    const t = "« La personne qui exprime la demande de recourir à une\nsubstance létale est accompagnée.";
    expect(deWrapper(t)).toBe(
      "« La personne qui exprime la demande de recourir à une substance létale est accompagnée.",
    );
  });
  it("recolle une continuation commençant par une référence d'article « L. 1234 »", () => {
    const t = "dans les conditions prévues aux articles\nL. 1111-12-2 à L. 1111-12-7 du code.";
    expect(deWrapper(t)).toBe(
      "dans les conditions prévues aux articles L. 1111-12-2 à L. 1111-12-7 du code.",
    );
  });
  it("ne recolle PAS un nouvel alinéa rédigé (« …»)", () => {
    const t = "« Le premier alinéa est applicable.\n« Le second alinéa est applicable. »";
    expect(deWrapper(t)).toBe(t); // deux alinéas distincts, chacun ouvert par «
  });
  it("ne recolle PAS après un deux-points (chapeau) ni un point-virgule", () => {
    const chapeau = "L'article 2 est complété par un alinéa ainsi rédigé :\n« Le nouvel alinéa.";
    expect(deWrapper(chapeau)).toBe(chapeau);
    const pv = "1° La première phrase ;\n2° La seconde phrase.";
    expect(deWrapper(pv)).toBe(pv);
  });
  it("ne recolle PAS deux phrases distinctes (fin de phrase . + Majuscule)", () => {
    const t = "Le dépôt s'effectue à la mairie.\nLe maire en accuse réception.";
    expect(deWrapper(t)).toBe(t);
  });
  it("préserve les lignes vides", () => {
    const t = "Bloc un.\n\nBloc deux.";
    expect(deWrapper(t)).toBe(t);
  });
  it("ne confond pas un nom commun (« section », « sous-section ») avec un en-tête de division", () => {
    const t = "les mots figurant à la\nsous-section est enregistrée dans un registre.";
    expect(deWrapper(t)).toBe(
      "les mots figurant à la sous-section est enregistrée dans un registre.",
    );
    // mais un VRAI en-tête suivi d'un numéro reste un marqueur (non recollé)
    const entete = "les dispositions suivantes.\nTITRE II\nDispositions finales.";
    expect(deWrapper(entete)).toContain("TITRE II");
  });
  it("ne recolle pas les marqueurs de subdivision (I., A., 1°, a), –)", () => {
    const t = "I. – Premier paragraphe wrappé sur\ndeux lignes ici.\nII. – Second paragraphe.";
    // la ligne « deux lignes ici. » est jointe au I., mais le II. reste séparé
    const r = deWrapper(t);
    expect(r).toContain("I. – Premier paragraphe wrappé sur deux lignes ici.");
    expect(r).toContain("II. – Second paragraphe.");
  });
});

describe("nettoyerPdf — effet sur R6-01 (le vrai bug des PDF réels)", () => {
  it("un alinéa cité wrappé sur 3 lignes ne produit plus 2 faux R6-01", () => {
    const chapeau = "L'article L. 5121-8-3 du code de la santé publique est complété par un alinéa ainsi rédigé :";
    const wrappe = [
      chapeau,
      "« La délivrance à l'unité s'effectue dans les conditions prévues aux",
      "articles L. 5121-8-4 à L. 5121-8-7, afin de garantir la traçabilité et",
      "la sécurité du médicament ainsi délivré. »",
    ].join("\n");
    const avant = analyser(wrappe).filter((f) => f.ruleId === "R6-01").length;
    const apres = analyser(nettoyerPdf(wrappe)).filter((f) => f.ruleId === "R6-01").length;
    expect(avant).toBeGreaterThanOrEqual(2); // le bug tel quel
    expect(apres).toBe(0); // corrigé après recollage
  });
});
