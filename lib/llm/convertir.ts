import { regleParId } from "@/lib/rules";
import type { Finding } from "@/lib/rules/types";
import { ancrer } from "@/lib/engine/fusion";
import type { ReponseLlm } from "./schema";

export function convertirFindingsLlm(bruts: ReponseLlm["findings"], texte: string): Finding[] {
  const findings: Finding[] = [];
  bruts.forEach((b, i) => {
    const regle = regleParId(b.ruleId);
    if (!regle) return;
    const severite = regle.severite === "enfreinte" ? "a_revoir" : regle.severite;
    findings.push({
      id: `${b.ruleId}:llm:${i}`,
      ruleId: b.ruleId,
      span: ancrer(b.citation, texte),
      extrait: b.citation,
      message: b.message,
      suggestion: b.suggestion ?? undefined,
      severite,
      source: "llm",
    });
  });
  return findings;
}
