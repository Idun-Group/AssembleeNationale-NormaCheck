export type Severite = "enfreinte" | "a_revoir" | "suggestion";

export type Famille =
  | "Titres"
  | "Divisions et subdivisions"
  | "Alinéas"
  | "Typographie"
  | "Modifications de la norme"
  | "Références"
  | "Formules standard"
  | "Cohérence du dispositif"
  | "Recevabilité et procédure";

export interface Span { start: number; end: number }

export interface Detection {
  span: Span;
  extrait: string;
  message?: string;
  suggestion?: string;
}

export type Detecteur = (texte: string) => Detection[];

export interface Regle {
  id: string;
  famille: Famille;
  ref: string;          // section du guide, ex "§9.2"
  titre: string;
  explication: string;
  exempleOk: string;
  exempleKo: string;
  severite: Severite;
  detecteur?: Detecteur; // absent = règle purement LLM
  llm?: string;          // instruction pour le prompt LLM
}

export interface Finding {
  id: string;            // `${ruleId}:${span.start}` ou `${ruleId}:llm:${n}`
  ruleId: string;
  span: Span | null;     // null = non ancré (citation LLM introuvable)
  extrait: string;
  message: string;
  suggestion?: string;
  severite: Severite;
  source: "regle" | "llm";
}
