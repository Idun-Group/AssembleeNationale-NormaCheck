import type { Finding } from "@/lib/rules/types";

export function appliquerCorrection(texte: string, f: Finding): string {
  if (!f.span || f.suggestion === undefined) return texte;
  return texte.slice(0, f.span.start) + f.suggestion + texte.slice(f.span.end);
}

export function appliquerToutes(texte: string, findings: Finding[]): string {
  const applicables = findings
    .filter((f) => f.span && f.suggestion !== undefined)
    .sort((a, b) => b.span!.start - a.span!.start); // fin -> début : offsets stables
  let resultat = texte;
  for (const f of applicables) resultat = appliquerCorrection(resultat, f);
  return resultat;
}
