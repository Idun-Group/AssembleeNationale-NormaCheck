import { describe, it, expect } from "vitest";
import { TYPOGRAPHIE } from "@/lib/rules/typographie";

function detecte(id: string, texte: string) {
  const r = TYPOGRAPHIE.find((x) => x.id === id)!;
  return r.detecteur!(texte);
}

describe("typographie §7.2", () => {
  it("R7.2-01 détecte les parenthèses", () => {
    const r = detecte("R7.2-01", "la commission (créée en 2020) statue");
    expect(r).toHaveLength(1);
    expect(r[0].extrait).toBe("(créée en 2020)");
  });
  it("R7.2-01 ignore un texte sans parenthèses", () => {
    expect(detecte("R7.2-01", "la commission statue")).toHaveLength(0);
  });
  it("R7.2-02 détecte un sigle", () => {
    expect(detecte("R7.2-02", "la CNIL est consultée").length).toBe(1);
  });
  it("R7.2-02 ignore les chiffres romains et exceptions", () => {
    expect(detecte("R7.2-02", "le titre III du livre VIII")).toHaveLength(0);
    expect(detecte("R7.2-02", "l'établissement public OSEO")).toHaveLength(0);
  });
  it("R7.2-02 détecte les sigles en lettres romaines hors contexte de division", () => {
    expect(detecte("R7.2-02", "un contrat CDD").length).toBeGreaterThanOrEqual(1);
    expect(detecte("R7.2-02", "un contrat CDI").length).toBeGreaterThanOrEqual(1);
    expect(detecte("R7.2-02", "la CNIL").length).toBeGreaterThanOrEqual(1);
  });
  it("R7.2-02 continue d'ignorer les vrais chiffres romains après un mot de division", () => {
    expect(detecte("R7.2-02", "le titre III du livre VIII")).toHaveLength(0);
    expect(detecte("R7.2-02", "l'article XV du code")).toHaveLength(0);
  });
  it("R7.2-02 ignore les marqueurs de paragraphe en chiffres romains en tête de ligne", () => {
    expect(
      detecte("R7.2-02", "II. – Les collectivités territoriales transmettent le rapport."),
    ).toHaveLength(0);
    expect(detecte("R7.2-02", "III. – Le préfet statue.")).toHaveLength(0);
    const r = detecte("R7.2-02", "transmettent.\nVIII. – Dispositions finales.");
    expect(r.every((f) => f.extrait !== "VIII")).toBe(true);
  });
  it("R7.2-02 continue de détecter un sigle en chiffres romains suivi d'un point hors tête de ligne", () => {
    expect(detecte("R7.2-02", "un contrat CDD").length).toBeGreaterThanOrEqual(1);
    expect(detecte("R7.2-02", "un contrat CDD.").length).toBeGreaterThanOrEqual(1);
  });
  it("R7.2-02 n'écrase pas les en-têtes, titres et signatures en capitales d'un texte réel", () => {
    // en-tête / titres de la PPL
    expect(detecte("R7.2-02", "ASSEMBLÉE NATIONALE")).toHaveLength(0);
    expect(detecte("R7.2-02", "EXPOSÉ DES MOTIFS")).toHaveLength(0);
    expect(detecte("R7.2-02", "MESDAMES, MESSIEURS")).toHaveLength(0);
    expect(detecte("R7.2-02", "PROPOSITION DE LOI")).toHaveLength(0);
    // bloc de signatures : patronymes en capitales après une civilité/prénom
    expect(detecte("R7.2-02", "M. Thibault BAZIN, M. Hubert BRIGAND")).toHaveLength(0);
    expect(detecte("R7.2-02", "Mme Véronique LOUWAGIE")).toHaveLength(0);
    // mais un vrai sigle en prose reste signalé
    expect(detecte("R7.2-02", "le rapport de la CNIL et de l'INSEE").length).toBeGreaterThanOrEqual(1);
  });
  it("R7.2-02 ignore les renvois de subdivision en chiffres romains", () => {
    expect(detecte("R7.2-02", "l'obligation prévue au II ne peut être désactivée")).toHaveLength(0);
    expect(detecte("R7.2-02", "dans les conditions du III du même article")).toHaveLength(0);
    expect(detecte("R7.2-02", "les dispositions des I à III sont applicables")).toHaveLength(0);
    expect(detecte("R7.2-02", "au sens du présent IV")).toHaveLength(0);
  });
  it("R7.2-02 ignore les préfixes d'article codifiés (« LP. 112 »)", () => {
    expect(detecte("R7.2-02", "l'article LP. 112-3 du code des impôts de la Polynésie")).toHaveLength(0);
    // mais un vrai sigle collé à côté reste détecté
    expect(detecte("R7.2-02", "un contrat CDD").length).toBeGreaterThanOrEqual(1);
  });
  it("R7.2-01 ignore les marqueurs éditoriaux de commission", () => {
    expect(detecte("R7.2-01", "Article 2 (nouveau)")).toHaveLength(0);
    expect(detecte("R7.2-01", "Le troisième alinéa (Supprimé)")).toHaveLength(0);
    expect(detecte("R7.2-01", "Voir les numéros (2024-2025)")).toHaveLength(0);
    // mais une vraie parenthèse rédactionnelle reste signalée
    expect(detecte("R7.2-01", "la commission (créée en 2020) statue").length).toBe(1);
  });
  it("R7.2-03 détecte les guillemets anglais", () => {
    expect(detecte("R7.2-03", 'les mots : "deux ans" sont supprimés').length).toBeGreaterThan(0);
  });
  it("R7.2-04 détecte Etat sans accent", () => {
    const r = detecte("R7.2-04", "un Etat membre");
    expect(r[0].suggestion).toBe("État");
    expect(detecte("R7.2-04", "un État membre")).toHaveLength(0);
  });
  it("R7.2-04 détecte « A la » en début de phrase", () => {
    expect(detecte("R7.2-04", "A la première phrase, le mot est supprimé")[0].suggestion).toBe("À la");
    expect(detecte("R7.2-04", "A. – L'article 3 est abrogé")).toHaveLength(0);
  });
  it("R7.2-04 n'écrase pas le verbe « avoir » en emploi médian", () => {
    expect(detecte("R7.2-04", "Le préfet A le pouvoir de décision")).toHaveLength(0);
    expect(detecte("R7.2-04", "il A la responsabilité")).toHaveLength(0);
  });
  it("R7.2-04 laisse le motif « Etat » intact indépendamment de la position", () => {
    const r = detecte("R7.2-04", "un Etat membre");
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].suggestion).toBe("État");
  });
  it("R7.2-05 détecte un nombre à points", () => {
    const r = detecte("R7.2-05", "un montant de 1.205.632 €");
    expect(r[0].suggestion).toBe("1 205 632");
    expect(detecte("R7.2-05", "un montant de 1 205 632 €")).toHaveLength(0);
  });
  it("R7.2-05 ignore les références de code (lettre.point)", () => {
    expect(detecte("R7.2-05", "l'article L.123.456 du code")).toHaveLength(0);
  });
  it("R7.2-05 ignore les références de code (lettre.point, suite)", () => {
    expect(detecte("R7.2-05", "aux articles R.512.46 et suivants")).toHaveLength(0);
  });
  it("R7.2-06 signale les nombres en chiffres pour les durées/personnes", () => {
    expect(detecte("R7.2-06", "une peine de 3 ans").length).toBe(1);
    expect(detecte("R7.2-06", "100 000 habitants")).toHaveLength(0); // exception habitants
  });
  it("R7.2-07 signale les locutions latines", () => {
    expect(detecte("R7.2-07", "les dispositions in fine du texte").length).toBe(1);
    expect(detecte("R7.2-07", "la finalité du texte")).toHaveLength(0);
  });
});
