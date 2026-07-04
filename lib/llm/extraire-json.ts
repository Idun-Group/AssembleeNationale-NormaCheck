export function extraireJson(brut: string): unknown {
  const fence = brut.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidat = fence ? fence[1] : brut;
  const debut = candidat.indexOf("{");
  const fin = candidat.lastIndexOf("}");
  if (debut === -1 || fin <= debut) throw new Error("aucun JSON dans la réponse");
  return JSON.parse(candidat.slice(debut, fin + 1));
}
