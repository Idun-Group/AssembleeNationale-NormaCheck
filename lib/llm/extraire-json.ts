/**
 * Trouve la fin de l'objet JSON équilibré (accolades) qui commence à `debut`,
 * en ignorant les accolades situées à l'intérieur des chaînes JSON.
 * Retourne l'index de l'accolade fermante correspondante, ou -1 si non trouvée.
 */
function trouverAccoladeFermante(candidat: string, debut: number): number {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = debut; i < candidat.length; i++) {
    const char = candidat[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

export function extraireJson(brut: string): unknown {
  const fence = brut.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidat = fence ? fence[1] : brut;

  // Essaie chaque occurrence de '{' comme point de départ potentiel : la prose
  // environnante peut contenir des accolades qui ne forment pas du JSON valide
  // (ex. un préambule "Réponds au format {clé: valeur} :"), donc on ne s'arrête
  // pas au premier objet équilibré trouvé si celui-ci ne parse pas.
  let depart = candidat.indexOf("{");
  while (depart !== -1) {
    const fin = trouverAccoladeFermante(candidat, depart);
    if (fin !== -1) {
      try {
        return JSON.parse(candidat.slice(depart, fin + 1));
      } catch {
        // Pas un JSON valide malgré des accolades équilibrées : on continue
        // la recherche à partir de la prochaine occurrence de '{'.
      }
    }
    depart = candidat.indexOf("{", depart + 1);
  }

  throw new Error("aucun JSON dans la réponse");
}
