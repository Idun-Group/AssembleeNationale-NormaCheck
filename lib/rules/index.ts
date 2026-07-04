import type { Famille, Regle } from "./types";
import { FORMULES_STANDARD } from "./formules-standard";
import { TYPOGRAPHIE } from "./typographie";
import { REFERENCES } from "./references";
import { STRUCTURELLES } from "./structurelles";
import { COHERENCE } from "./coherence";
import { REGLES_LLM } from "./llm";
export * from "./types";

export const REGLES: Regle[] = [
  ...FORMULES_STANDARD,
  ...TYPOGRAPHIE,
  ...REFERENCES,
  ...STRUCTURELLES,
  ...COHERENCE,
  ...REGLES_LLM,
];

export const FAMILLES: Famille[] = [
  "Titres", "Divisions et subdivisions", "Alinéas", "Typographie",
  "Modifications de la norme", "Références", "Formules standard",
  "Cohérence du dispositif", "Recevabilité et procédure",
];

export function regleParId(id: string): Regle | undefined {
  return REGLES.find((r) => r.id === id);
}
