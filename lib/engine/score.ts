import { regleParId } from "@/lib/rules";
import type { Finding, Severite } from "@/lib/rules/types";

const POIDS: Record<Severite, number> = { enfreinte: 5, a_revoir: 3, suggestion: 1 };

export interface Score {
  global: number;
  parSeverite: Record<Severite, number>;
  parFamille: Record<string, number>;
}

export function calculerScore(findings: Finding[], texte: string): Score {
  const nbMots = Math.max(texte.trim().split(/\s+/).length, 1);
  const somme = findings.reduce((s, f) => s + POIDS[f.severite], 0);
  const global = Math.round(100 * Math.exp((-6 * somme) / nbMots));
  const parSeverite: Record<Severite, number> = { enfreinte: 0, a_revoir: 0, suggestion: 0 };
  const parFamille: Record<string, number> = {};
  for (const f of findings) {
    parSeverite[f.severite]++;
    const fam = regleParId(f.ruleId)?.famille ?? "Autre";
    parFamille[fam] = (parFamille[fam] ?? 0) + 1;
  }
  return { global, parSeverite, parFamille };
}
