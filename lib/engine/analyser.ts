import { REGLES } from "@/lib/rules";
import type { Finding } from "@/lib/rules/types";

export function analyser(texte: string): Finding[] {
  const findings: Finding[] = [];
  for (const regle of REGLES) {
    if (!regle.detecteur) continue;
    for (const d of regle.detecteur(texte)) {
      findings.push({
        id: `${regle.id}:${d.span.start}`,
        ruleId: regle.id,
        span: d.span,
        extrait: d.extrait,
        message: d.message ?? regle.explication,
        suggestion: d.suggestion,
        severite: regle.severite,
        source: "regle",
      });
    }
  }
  return findings.sort((a, b) => a.span!.start - b.span!.start || a.ruleId.localeCompare(b.ruleId));
}
