export interface Ligne { texte: string; start: number; end: number }

export type TypeLigne =
  | "paragraphe_romain" | "lettre_maj" | "numero" | "lettre_min"
  | "enum_degre" | "enum_lettre" | "tiret"
  | "alinea_redige" | "chapeau_redige" | "autre";

export interface LigneClassifiee extends Ligne {
  type: TypeLigne;
  marqueur?: string;   // "I", "A", "1", "a", "1°", "a)"…
  avecTiret?: boolean; // pour paragraphe_romain / lettre_maj / numero / lettre_min
}

export function decouperLignes(texte: string): Ligne[] {
  const lignes: Ligne[] = [];
  let start = 0;
  for (const part of texte.split("\n")) {
    lignes.push({ texte: part, start, end: start + part.length });
    start += part.length + 1;
  }
  return lignes;
}

const RE_ROMAIN = /^([IVXLCDM]+)\.\s*(–|-)?\s/;
const RE_LETTRE_MAJ = /^([A-Z])\.\s*(–|-)?\s/;
const RE_NUMERO = /^(\d+)\.\s*(–|-)?\s/;
const RE_LETTRE_MIN = /^([a-z])\.\s*(–|-)?\s/;
const RE_ENUM_DEGRE = /^(\d+°(?:\s?(?:bis|ter|quater))?)\s/;
const RE_ENUM_LETTRE = /^([a-z])\)\s/;
const RE_TIRET = /^[–-]\s/;
const RE_CHAPEAU = /(ainsi rédigée?s?\s*:|ainsi modifiée?s?\s*:)\s*$/;

// En-tête d'article marquant l'entrée dans le dispositif (« Article 1er »,
// « Article premier », « Article unique »). Majuscule initiale exigée pour ne
// pas confondre avec un renvoi en prose (« l'article 1er de la loi… »).
const RE_ARTICLE_ENTETE = /^Article\s+(premier|1(?:er|ère|re)?|unique)\b/;

/**
 * Offset du début du dispositif quand le texte comporte un exposé des motifs.
 * Les règles de légistique (typographie, structure, formules) visent le texte
 * NORMATIF : appliquées à la prose de l'exposé, elles produisent des faux
 * positifs (parenthèses d'appels de note, sigles glosés, chiffres statistiques).
 * On renvoie l'offset du premier en-tête d'article situé APRÈS « EXPOSÉ DES
 * MOTIFS ». En l'absence d'exposé (ou d'en-tête d'article), on renvoie 0 :
 * aucun filtrage, comportement inchangé pour un dispositif collé seul.
 */
export function debutDispositif(texte: string): number {
  const iExpose = texte.search(/EXPOS[EÉ]\s+DES\s+MOTIFS/i);
  if (iExpose === -1) return 0;
  for (const l of decouperLignes(texte)) {
    if (l.start > iExpose && RE_ARTICLE_ENTETE.test(l.texte.replace(/^\s+/, ""))) {
      return l.start;
    }
  }
  return 0;
}

export function classifierLigne(l: Ligne): LigneClassifiee {
  const t = l.texte;
  let m: RegExpMatchArray | null;
  if (t.startsWith("«")) return { ...l, type: "alinea_redige" };
  if ((m = t.match(RE_ROMAIN))) return { ...l, type: "paragraphe_romain", marqueur: m[1], avecTiret: !!m[2] };
  if ((m = t.match(RE_LETTRE_MAJ))) return { ...l, type: "lettre_maj", marqueur: m[1], avecTiret: !!m[2] };
  if ((m = t.match(RE_NUMERO))) return { ...l, type: "numero", marqueur: m[1], avecTiret: !!m[2] };
  if ((m = t.match(RE_LETTRE_MIN))) return { ...l, type: "lettre_min", marqueur: m[1], avecTiret: !!m[2] };
  if ((m = t.match(RE_ENUM_DEGRE))) return { ...l, type: "enum_degre", marqueur: m[1] };
  if ((m = t.match(RE_ENUM_LETTRE))) return { ...l, type: "enum_lettre", marqueur: m[1] };
  if (RE_TIRET.test(t)) return { ...l, type: "tiret" };
  if (RE_CHAPEAU.test(t)) return { ...l, type: "chapeau_redige" };
  return { ...l, type: "autre" };
}
