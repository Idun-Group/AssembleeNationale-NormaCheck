import type { Famille, Regle } from "./types";
export * from "./types";

// Les tableaux par famille sont ajoutés par les tâches suivantes :
// import { FORMULES_STANDARD } from "./formules-standard"; etc.
export const REGLES: Regle[] = [
  // ...FORMULES_STANDARD, ...TYPOGRAPHIE, ...REFERENCES, ...STRUCTURELLES, ...REGLES_LLM
];

export const FAMILLES: Famille[] = [
  "Titres", "Divisions et subdivisions", "Alinéas", "Typographie",
  "Modifications de la norme", "Références", "Formules standard",
];

export function regleParId(id: string): Regle | undefined {
  return REGLES.find((r) => r.id === id);
}
