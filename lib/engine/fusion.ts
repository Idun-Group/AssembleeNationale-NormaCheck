import type { Finding, Span } from "@/lib/rules/types";

export function chevauche(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

// Construit un motif tolérant à partir d'une citation LLM : les espaces
// deviennent \s+ (le PDF peut avoir un saut de ligne là où le modèle met une
// espace) et les apostrophes / guillemets typographiques sont interchangeables
// (le modèle restitue souvent ' au lieu de ' ou " au lieu de «…»). On cherche
// ensuite ce motif dans le texte ORIGINAL pour conserver les offsets réels.
function citationVersRegex(citation: string): RegExp | null {
  const t = citation.trim();
  if (t.length < 3) return null;
  const motif = t
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // échappe les métacaractères
    .replace(/\s+/g, "\\s+")
    .replace(/['’‘]/g, "['’‘]")
    .replace(/["«»“”]/g, '["«»“”]');
  try {
    return new RegExp(motif);
  } catch {
    return null;
  }
}

export function ancrer(citation: string, texte: string): Span | null {
  const i = texte.indexOf(citation);
  if (i !== -1) return { start: i, end: i + citation.length };
  // Repli tolérant (typographie/espaces) — récupère les citations LLM que le
  // indexOf exact manque à cause d'une apostrophe droite ou d'un saut de ligne.
  const motif = citationVersRegex(citation);
  const m = motif ? motif.exec(texte) : null;
  return m ? { start: m.index, end: m.index + m[0].length } : null;
}

export function fusionner(deterministes: Finding[], llm: Finding[]): Finding[] {
  const retenus = llm.filter(
    (l) => !l.span || !deterministes.some((d) => d.span && chevauche(d.span!, l.span!)),
  );
  return [...deterministes, ...retenus].sort((a, b) => {
    if (!a.span) return 1;
    if (!b.span) return -1;
    return a.span.start - b.span.start;
  });
}
