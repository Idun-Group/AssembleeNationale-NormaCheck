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
