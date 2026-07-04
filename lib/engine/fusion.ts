import type { Finding, Span } from "@/lib/rules/types";

export function chevauche(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

export function ancrer(citation: string, texte: string): Span | null {
  const i = texte.indexOf(citation);
  return i === -1 ? null : { start: i, end: i + citation.length };
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
