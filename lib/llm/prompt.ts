import { REGLES } from "@/lib/rules";

export function construirePrompt(texte: string): string {
  const regles = REGLES.filter((r) => r.llm)
    .map((r) => `- [${r.id}] ${r.titre} (${r.ref})\n  ${r.explication}\n  Consigne : ${r.llm}`)
    .join("\n");
  return `Tu es un expert en légistique de l'Assemblée nationale. Analyse le texte législatif fourni au regard des règles suivantes du guide de légistique, et UNIQUEMENT de celles-ci :

${regles}

Contraintes impératives :
- Pour chaque problème détecté, "citation" doit reproduire VERBATIM un passage court (5 à 25 mots) du texte fourni, caractère pour caractère (mêmes espaces, mêmes guillemets), pour permettre son surlignage.
- "ruleId" doit être l'un des identifiants ci-dessus.
- "message" explique le problème en une ou deux phrases, en français, de façon pédagogique.
- "suggestion" propose une réécriture du passage cité, ou null si aucune réécriture sûre n'est possible.
- Ne signale rien qui relève de fautes purement mécaniques (formules standard, typographie) : un autre analyseur s'en charge.
- En l'absence de problème, retourne {"findings": []}.

Réponds UNIQUEMENT avec un objet JSON de la forme {"findings": [{"ruleId": "...", "citation": "...", "message": "...", "suggestion": "... ou null"}]} — aucun texte avant ou après, pas de bloc de code.

Texte à analyser :

${texte}`;
}
