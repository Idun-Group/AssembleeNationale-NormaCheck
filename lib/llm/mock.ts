import { REGLES } from "@/lib/rules";

/**
 * Mode démo hors-ligne (opt-in via NORMACHECK_LLM_MOCK=1).
 *
 * Quand la CLI `claude` est indisponible (hors-ligne, token expiré, sur un poste
 * de démo sans authentification), ce mock produit une réponse LLM plausible SANS
 * appeler le modèle, pour que la couche « analyse approfondie » reste
 * démontrable. Il n'est JAMAIS actif par défaut : sans la variable d'environnement,
 * `executerLlm` appelle la vraie CLI.
 *
 * Le mock est « intelligent » : il extrait le texte à analyser du prompt et cite
 * des extraits RÉELS de ce texte, afin que les findings s'ancrent et se
 * surlignent correctement quel que soit le texte fourni.
 */
export function reponseLlmMock(prompt: string): string {
  const texte = extraireTexteDuPrompt(prompt);
  const idsLlm = REGLES.filter((r) => r.llm).map((r) => r.id);
  const findings: Array<{
    ruleId: string;
    citation: string;
    message: string;
    suggestion: string | null;
  }> = [];

  // 1) Titre trop long (RL-01) : si le texte comporte une ligne « PROPOSITION DE LOI »
  //    suivie d'un intitulé, on cite l'intitulé.
  if (idsLlm.includes("RL-01")) {
    const intitule = citationIntitule(texte);
    if (intitule) {
      findings.push({
        ruleId: "RL-01",
        citation: intitule,
        message:
          "L'intitulé gagnerait à être plus bref ; un titre de loi doit résumer le contenu sans détailler les modalités.",
        suggestion: null,
      });
    }
  }

  // 2) Référence à vérifier (RL-03) : « du même code » / « du présent code » / « la présente loi ».
  if (idsLlm.includes("RL-03")) {
    const ref = premiereOccurrence(texte, [
      "du même code",
      "du même article",
      "de la présente loi",
      "du présent code",
    ]);
    if (ref) {
      findings.push({
        ruleId: "RL-03",
        citation: ref,
        message:
          "Vérifiez que cette référence relative désigne sans ambiguïté le bon texte ; « du même … » doit renvoyer à la référence codifiée citée juste avant.",
        suggestion: null,
      });
    }
  }

  // 3) Précision du point d'impact (RL-02) : cite un « alinéa de l'article … » réel.
  if (idsLlm.includes("RL-02")) {
    const impact = premiereOccurrenceRegex(
      texte,
      /(?:premier|deuxième|dernier|second)\s+alinéa\s+de\s+l['’]article\s+[LRD]?\.?\s*[\d-]+/i,
    );
    if (impact) {
      findings.push({
        ruleId: "RL-02",
        citation: impact,
        message:
          "Point d'impact : assurez-vous qu'il est le plus précis possible (phrase, membre de phrase) pour éviter toute ambiguïté d'application.",
        suggestion: null,
      });
    }
  }

  return JSON.stringify({ findings });
}

function extraireTexteDuPrompt(prompt: string): string {
  const marqueur = "Texte à analyser :";
  const i = prompt.lastIndexOf(marqueur);
  return i === -1 ? prompt : prompt.slice(i + marqueur.length).trim();
}

function premiereOccurrence(texte: string, aiguilles: string[]): string | null {
  for (const a of aiguilles) {
    if (texte.includes(a)) return a;
  }
  return null;
}

function premiereOccurrenceRegex(texte: string, re: RegExp): string | null {
  const m = texte.match(re);
  return m ? m[0] : null;
}

function citationIntitule(texte: string): string | null {
  // Après « PROPOSITION DE LOI » / « PROJET DE LOI », prend la première ligne
  // non vide (l'intitulé), tronquée à un extrait ancrable (≤ 90 caractères).
  const m = texte.match(/(?:PROPOSITION|PROJET)\s+DE\s+LOI\s*\n+\s*([^\n]{15,})/);
  if (!m) return null;
  const intitule = m[1].trim().replace(/[,.]$/, "");
  return intitule.length > 90 ? intitule.slice(0, 90).trimEnd() : intitule;
}
