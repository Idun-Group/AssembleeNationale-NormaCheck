/**
 * Nettoyage spécifique aux textes extraits d'un PDF (pdf-parse v2).
 *
 * Les PDF de l'Assemblée nationale posent deux problèmes qui NE concernent PAS
 * un copier-coller ni un .docx, et qu'on corrige donc ici — uniquement sur la
 * branche PDF de la route d'import :
 *
 *  1. Glyphes de zone privée Unicode (U+E000…U+F8FF) : les gouttières de
 *     numérotation de lignes des PDF AN sont encodées comme des glyphes PUA
 *     (U+F04C…). Non nettoyés, ils polluent le texte et déclenchent des faux
 *     R6-01 (« guillemet ouvrant manquant »).
 *
 *  2. Lignes physiques wrappées : une phrase citée « … » longue est coupée par
 *     la mise en page sur plusieurs lignes. Le parseur structurel (R5-01, R6-01)
 *     raisonnant par ligne, chaque ligne de continuation est prise pour un
 *     alinéa → un faux positif par ligne. On recolle donc les continuations en
 *     alinéas logiques AVANT toute analyse.
 *
 * Choix de conception : on privilégie la SUPPRESSION du bruit (faux positifs).
 * Un recollage trop agressif ne produit au pire qu'un faux négatif (un vrai
 * R6-01 manqué), bien moins grave que 180 faux positifs sur un texte réel.
 */

const PUA = /[\uE000-\uF8FF]/g;
const LIGNE_NUMERO_PAGE = /^\s*[-–—]{1,}\s*\d{1,4}\s*[-–—]*\s*$/;

/** Un token de référence d'article codifié (« L. 228 », « LP. 112 », « R. 512 »)
 *  n'est PAS un marqueur de subdivision : il peut être recollé à la ligne
 *  précédente. On le teste avant les marqueurs pour éviter de le confondre avec
 *  la subdivision « A. »/« L. ». */
const REF_ARTICLE = /^[A-Za-z]{1,3}\.\s*\d/;

/** La ligne (déjà rognée à gauche) débute-t-elle par un marqueur de structure
 *  qui ouvre un nouvel alinéa/segment logique (donc à ne pas recoller) ? */
function commenceParMarqueur(s: string): boolean {
  if (/^[«»]/.test(s)) return true;
  if (REF_ARTICLE.test(s)) return false; // réf d'article → continuation joignable
  if (/^Art\.\s/.test(s)) return true;
  // En-tête de division/article : le mot-clé doit être suivi d'un numéro ou
  // d'un ordinal (« TITRE II », « Article 3 »). Sinon on ne confond pas un nom
  // commun de prose (« la sous-section est enregistrée », « article. ») avec un
  // en-tête, ce qui empêcherait à tort de le recoller.
  if (/^(TITRE|CHAPITRE|LIVRE|SECTION|SOUS-SECTION|PARTIE|PARAGRAPHE|ARTICLE)\s+(premier|unique|1er|Ier|[IVXLCDM]+|\d+)\b/i.test(s)) return true;
  if (/^[IVXLCDM]+\.\s*[–-]?\s/.test(s)) return true; // paragraphe romain
  if (/^[A-Z]\.\s*[–-]?\s/.test(s)) return true; // lettre majuscule
  if (/^\d+\.\s*[–-]?\s/.test(s)) return true; // numéro
  if (/^[a-z]\.\s*[–-]?\s/.test(s)) return true; // lettre minuscule
  if (/^\d+°/.test(s)) return true; // énumération en degré
  if (/^[a-z]\)\s/.test(s)) return true; // énumération en lettre
  if (/^[–—-]\s/.test(s)) return true; // tiret
  return false;
}

/** La ligne `cur` est-elle la continuation wrappée de `prev` ? */
function estContinuation(prev: string, cur: string): boolean {
  const p = prev.replace(/\s+$/, "");
  const c = cur.replace(/^\s+/, "");
  if (!p || !c) return false; // ligne vide : jamais une continuation (préserve les blocs)
  if (commenceParMarqueur(c)) return false; // nouvel alinéa/segment
  if (/[;:»]$/.test(p)) return false; // terminateur structurel fort
  // Vraie fin de phrase (. ! ?) NON précédée d'une abréviation en capitale
  // (« L. », « art. »… — le point y est un point d'abréviation, pas de phrase).
  if (/[.!?]$/.test(p) && !/[A-ZÀ-Ý]\.$/.test(p)) return false;
  return true;
}

/** Recolle les lignes physiques wrappées en alinéas logiques. */
export function deWrapper(texte: string): string {
  const lignes = texte.split("\n");
  const out: string[] = [];
  for (const ligne of lignes) {
    if (out.length > 0 && estContinuation(out[out.length - 1], ligne)) {
      out[out.length - 1] = out[out.length - 1].replace(/\s+$/, "") + " " + ligne.replace(/^\s+/, "");
    } else {
      out.push(ligne);
    }
  }
  return out.join("\n");
}

/** Pipeline complet de nettoyage d'un texte extrait d'un PDF. */
export function nettoyerPdf(texte: string): string {
  const sansPua = texte.replace(PUA, "");
  const sansPages = sansPua
    .split("\n")
    .filter((l) => !LIGNE_NUMERO_PAGE.test(l))
    .join("\n");
  return deWrapper(sansPages);
}
