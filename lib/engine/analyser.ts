import { REGLES } from "@/lib/rules";
import type { Finding } from "@/lib/rules/types";
import { debutDispositif } from "@/lib/engine/structure";

export function analyser(texte: string): Finding[] {
  // Les règles déterministes visent le dispositif : on écarte tout finding
  // tombant dans l'exposé des motifs (prose non normative), source de faux
  // positifs. `debut` = 0 s'il n'y a pas d'exposé identifiable (aucun filtrage).
  const debut = debutDispositif(texte);
  const findings: Finding[] = [];
  for (const regle of REGLES) {
    if (!regle.detecteur) continue;
    for (const d of regle.detecteur(texte)) {
      if (d.span.start < debut) continue;
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
