import type { Detection, Regle } from "./types";
import { decouperLignes, classifierLigne, type LigneClassifiee } from "@/lib/engine/structure";

function regleDivisions(r: Omit<Regle, "famille">): Regle {
  return { famille: "Divisions et subdivisions", ...r };
}

function regleAlineas(r: Omit<Regle, "famille">): Regle {
  return { famille: "Alinéas", ...r };
}

function classifier(texte: string): LigneClassifiee[] {
  return decouperLignes(texte).map(classifierLigne);
}

// Une ligne « M. Jean-Luc BOURGEAUX… » est la civilité « Monsieur », pas une
// subdivision de niveau A/B/C… : le marqueur « M » y est suivi d'un nom propre
// (mot commençant par une majuscule). On l'écarte de R5-01 pour ne pas
// signaler les blocs de signatures d'un texte réel.
function estCiviliteMonsieur(l: { marqueur?: string; texte: string }): boolean {
  if (l.marqueur !== "M") return false;
  const reste = l.texte.slice(2).trimStart(); // après « M. »
  return /^[A-ZÀ-Ý]/.test(reste);
}

// « L. 228 », « R. 512-1 », « D. 2 » : une référence d'article codifié (partie
// Législative / Réglementaire / Décret) suivie d'un numéro, et non une
// subdivision de type « A. ». Fréquent quand un PDF coupe « …de l'article
// L. 228 » en fin de ligne. On l'écarte de R5-01.
function estReferenceCodeArticle(l: { marqueur?: string; texte: string }): boolean {
  if (!l.marqueur || !/^[LRD]$/.test(l.marqueur)) return false;
  return /^[LRD]\.\s*\d/.test(l.texte.replace(/^\s+/, ""));
}

// R5-01 — paragraphe_romain | lettre_maj SANS tiret : le tiret est obligatoire.
function detecteTiretManquant(texte: string): Detection[] {
  const out: Detection[] = [];
  for (const l of classifier(texte)) {
    if (
      (l.type === "paragraphe_romain" || l.type === "lettre_maj") &&
      l.avecTiret === false &&
      l.marqueur &&
      !estCiviliteMonsieur(l) &&
      !estReferenceCodeArticle(l)
    ) {
      const start = l.start;
      const end = l.start + l.marqueur.length + 1; // couvre "I." ou "A."
      out.push({
        span: { start, end },
        extrait: l.texte.slice(0, l.marqueur.length + 1),
        message: "Les subdivisions I. et A. sont suivies d'un tiret.",
        suggestion: `${l.marqueur}. –`,
      });
    }
  }
  return out;
}

// R5-02 — numero | lettre_min AVEC tiret : le tiret est proscrit.
function detecteTiretIndu(texte: string): Detection[] {
  const out: Detection[] = [];
  for (const l of classifier(texte)) {
    if (
      (l.type === "numero" || l.type === "lettre_min") &&
      l.avecTiret === true &&
      l.marqueur
    ) {
      const start = l.start;
      // repère la portion "<marqueur>. –" (ou "-") au début de la ligne
      const m = l.texte.match(/^([^.]+)\.\s*(–|-)\s*/);
      const matched = m ? m[0] : `${l.marqueur}. – `;
      const end = start + matched.length;
      out.push({
        span: { start, end },
        extrait: l.texte.slice(0, matched.length),
        message: "Les subdivisions 1. et a. ne sont pas suivies d'un tiret.",
        suggestion: `${l.marqueur}.`,
      });
    }
  }
  return out;
}

// R5-03 — enum_degre | enum_lettre dont le premier caractère après le
// marqueur (et l'espace) est une minuscule : la subdivision doit débuter
// par une majuscule (sauf les tirets, exclus de cette règle).
function detecteMinusculeDebutEnumeration(texte: string): Detection[] {
  const out: Detection[] = [];
  for (const l of classifier(texte)) {
    if ((l.type === "enum_degre" || l.type === "enum_lettre") && l.marqueur) {
      // texte après le marqueur : trouve la première espace suivant le marqueur
      const reste = l.texte.slice(l.marqueur.length);
      const espaceMatch = reste.match(/^\s+/);
      const offsetEspace = espaceMatch ? espaceMatch[0].length : 0;
      const offsetCaractere = l.marqueur.length + offsetEspace;
      // Notation de plage « 1° à 3° (Supprimés) » : le « à » n'est pas un début
      // de subdivision en minuscule mais un connecteur de plage. On l'écarte.
      if (/^à\s+\d/.test(l.texte.slice(offsetCaractere))) continue;
      const car = l.texte[offsetCaractere];
      if (car && /[a-zà-ÿ]/.test(car)) {
        const start = l.start + offsetCaractere;
        out.push({
          span: { start, end: start + 1 },
          extrait: car,
          message:
            "Toute subdivision faisant partie d'une série, à l'exception de celles commençant par un tiret, débute par une majuscule.",
          suggestion: car.toUpperCase(),
        });
      }
    }
  }
  return out;
}

// R5-04 — enum_degre | enum_lettre | tiret suivi (en sautant les lignes
// vides) d'un autre élément d'énumération (même famille ou imbriquée) et
// dont la ligne ne se termine ni par ";" ni par "; »" ni par ":".
function detecteSansPointVirgule(texte: string): Detection[] {
  const out: Detection[] = [];
  const lignes = classifier(texte);
  const estElementEnumeration = (l: LigneClassifiee) =>
    l.type === "enum_degre" || l.type === "enum_lettre" || l.type === "tiret";

  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (!estElementEnumeration(l)) continue;

    // cherche la prochaine ligne non vide
    let j = i + 1;
    while (j < lignes.length && lignes[j].texte.trim() === "") j++;
    const suivante = j < lignes.length ? lignes[j] : undefined;
    if (!suivante || !estElementEnumeration(suivante)) continue; // dernier élément : pas de violation

    const texteLigne = l.texte.trimEnd();
    if (/(;|;\s*»|:)$/.test(texteLigne)) continue; // termine correctement

    // trouve le dernier caractère non blanc de la ligne (dans le texte original, avant trimEnd)
    const finSansEspaces = l.texte.replace(/\s+$/, "");
    if (finSansEspaces.length === 0) continue;
    const offsetDernierCar = finSansEspaces.length - 1;
    const start = l.start + offsetDernierCar;
    out.push({
      span: { start, end: start + 1 },
      extrait: finSansEspaces[offsetDernierCar],
      message: "Tout élément d'énumération non final s'achève par un point-virgule.",
    });
  }
  return out;
}

// Regroupe les blocs rédigés : après une ligne chapeau_redige, les lignes
// suivantes appartiennent au bloc jusqu'à une ligne vide, un nouveau
// chapeau_redige, ou une fermeture par « » » qui n'est pas immédiatement
// suivie (sans saut de ligne vide) d'une nouvelle ligne commençant par «
// (auquel cas la fermeture était prématurée : cf. R6-02, le bloc continue).
interface BlocRedige {
  chapeau: number;
  lignes: number[];
}

const FIN_BLOC_RE = /»[\s;:.,]*$/;

function blocsRediges(lignes: LigneClassifiee[]): BlocRedige[] {
  const blocs: BlocRedige[] = [];
  for (let i = 0; i < lignes.length; i++) {
    if (lignes[i].type !== "chapeau_redige") continue;
    const chapeau = i;
    const lignesBloc: number[] = [];
    let j = i + 1;
    while (j < lignes.length) {
      const courante = lignes[j];
      if (courante.texte.trim() === "") break; // ligne vide : le bloc s'arrête (non consommée)
      if (courante.type === "chapeau_redige") break; // nouveau bloc : le bloc s'arrête (non consommée)

      lignesBloc.push(j);

      const finSansEspaces = courante.texte.replace(/\s+$/, "");
      if (FIN_BLOC_RE.test(finSansEspaces)) {
        // Fermeture par » : regarde la ligne immédiatement suivante (sans
        // sauter les lignes vides) pour savoir si elle continue le bloc.
        const suivante = lignes[j + 1];
        const continue_ =
          suivante !== undefined &&
          suivante.texte.trim() !== "" &&
          suivante.type !== "chapeau_redige" &&
          suivante.texte.trimStart().startsWith("«");
        if (continue_) {
          j++;
          continue;
        }
        break; // fermeture naturelle
      }
      j++;
    }
    blocs.push({ chapeau, lignes: lignesBloc });
  }
  return blocs;
}

// R6-01 — ligne du bloc rédigé sans guillemet ouvrant «.
function detecteGuillemetOuvrantManquant(texte: string): Detection[] {
  const out: Detection[] = [];
  const lignes = classifier(texte);
  const blocs = blocsRediges(lignes);
  // Types de lignes qui, à l'intérieur d'un bloc, sont des INSTRUCTIONS de
  // modification imbriquées (« 1° … est ainsi rédigé : », « a) … ») et non des
  // alinéas rédigés : R6-01 (guillemet ouvrant) ne s'y applique pas. Un vrai
  // alinéa rédigé qui serait une énumération s'écrit « 1° … » (ouvert par «).
  const TYPES_INSTRUCTION = new Set([
    "enum_degre", "enum_lettre", "numero", "lettre_min", "lettre_maj", "paragraphe_romain", "chapeau_redige",
  ]);
  for (const bloc of blocs) {
    for (const idx of bloc.lignes) {
      const l = lignes[idx];
      const trimme = l.texte.trimStart();
      if (trimme.startsWith("«")) continue;
      if (/:\s*$/.test(l.texte)) continue; // chapeau/instruction se terminant par « : »
      if (TYPES_INSTRUCTION.has(l.type)) continue; // marqueur de modification imbriqué
      out.push({
        span: { start: l.start, end: l.end },
        extrait: l.texte,
        message: "Tout alinéa rédigé commence par des guillemets.",
      });
    }
  }
  return out;
}

// R6-02 — guillemet fermant » apparaissant avant la fin du bloc (une ligne
// intermédiaire, pas la dernière, se termine par » alors que le bloc continue).
function detecteGuillemetFermantPrecoce(texte: string): Detection[] {
  const out: Detection[] = [];
  const lignes = classifier(texte);
  const blocs = blocsRediges(lignes);
  for (const bloc of blocs) {
    for (let k = 0; k < bloc.lignes.length - 1; k++) {
      const idx = bloc.lignes[k];
      const l = lignes[idx];
      const finSansEspaces = l.texte.replace(/\s+$/, "");
      if (finSansEspaces.endsWith("»")) {
        const offset = finSansEspaces.length - 1;
        const start = l.start + offset;
        out.push({
          span: { start, end: start + 1 },
          extrait: "»",
          message:
            "Seul le dernier alinéa d'un bloc rédigé est clos par des guillemets.",
        });
      }
    }
  }
  return out;
}

// R5-05 — numérotation en double : deux subdivisions CONSÉCUTIVES de même
// niveau portent le même numéro (« I, II, II, IV »). Conservateur pour éviter
// les faux positifs : on remet les compteurs à zéro à chaque ligne vide, à
// chaque en-tête d'article et à chaque chapeau rédigé (les énumérations
// indépendantes en sont ainsi séparées) ; un niveau supérieur réinitialise les
// niveaux plus profonds (les sous-énumérations recommencent).
const RANG_NIVEAU: Partial<Record<string, number>> = {
  paragraphe_romain: 1,
  lettre_maj: 2,
  numero: 3,
  enum_degre: 3,
  lettre_min: 4,
  enum_lettre: 4,
};

function detecteNumerotationDupliquee(texte: string): Detection[] {
  const out: Detection[] = [];
  let dernier: Record<string, string> = {};
  for (const l of classifier(texte)) {
    if (l.texte.trim() === "" || /^Article\b/i.test(l.texte.replace(/^\s+/, "")) || l.type === "chapeau_redige") {
      dernier = {};
      continue;
    }
    const rang = RANG_NIVEAU[l.type];
    if (!rang || !l.marqueur) continue;
    // Plage « 1° à 3° (Supprimés) » : ce n'est pas une subdivision numérotée
    // isolée, on ne la compte pas comme un doublon potentiel.
    if (/^\s*\d+°(?:\s*(?:bis|ter|quater))?\s*à\s*\d+°/.test(l.texte)) continue;
    for (const t of Object.keys(dernier)) {
      if ((RANG_NIVEAU[t] ?? 0) > rang) delete dernier[t];
    }
    if (dernier[l.type] === l.marqueur) {
      out.push({
        span: { start: l.start, end: l.start + l.marqueur.length },
        extrait: l.marqueur,
        message:
          "Numérotation en double : deux subdivisions consécutives portent le même numéro. Vérifier la séquence.",
      });
    }
    dernier[l.type] = l.marqueur;
  }
  return out;
}

export const STRUCTURELLES: Regle[] = [
  regleDivisions({
    id: "R5-01",
    ref: "§5",
    severite: "enfreinte",
    titre: "Tiret manquant après les subdivisions I. et A.",
    explication:
      "Les structures qui ne font pas partie d'énumérations annoncées par des « chapeaux » se présentent avec un tiret après les subdivisions I et A (mais pas après 1 et a).",
    exempleKo: "I. L'article L. 2 du code du sport est abrogé.",
    exempleOk: "I. – L'article L. 2 du code du sport est abrogé.",
    detecteur: detecteTiretManquant,
  }),
  regleDivisions({
    id: "R5-02",
    ref: "§5",
    severite: "enfreinte",
    titre: "Tiret indu après les subdivisions 1. et a.",
    explication:
      "Les subdivisions 1. et a. ne comportent pas de tiret, à la différence des subdivisions I. et A. (noter le tiret après I et A, mais pas après 1 et a).",
    exempleKo: "1. – L'article L. 4 du code du sport est abrogé.",
    exempleOk: "1. L'article L. 4 du code du sport est abrogé.",
    detecteur: detecteTiretIndu,
  }),
  regleDivisions({
    id: "R5-03",
    ref: "§5",
    severite: "enfreinte",
    titre: "Majuscule en début de subdivision d'énumération",
    explication:
      "Toute subdivision faisant partie d'une série, à l'exception de celles commençant par un tiret, débute par une majuscule.",
    exempleKo: "1° le deuxième alinéa est supprimé ;",
    exempleOk: "1° Le deuxième alinéa est supprimé ;",
    detecteur: detecteMinusculeDebutEnumeration,
  }),
  regleDivisions({
    id: "R5-04",
    ref: "§5",
    severite: "enfreinte",
    titre: "Point-virgule manquant en fin d'élément d'énumération non final",
    explication:
      "Toute subdivision faisant partie d'une série, à l'exception de celles qui clôturent une énumération, s'achève par un point-virgule.",
    exempleKo: "1° Le deuxième alinéa est supprimé.\n2° Le troisième alinéa est supprimé.",
    exempleOk: "1° Le deuxième alinéa est supprimé ;\n2° Le troisième alinéa est supprimé.",
    detecteur: detecteSansPointVirgule,
  }),
  regleDivisions({
    id: "R5-05",
    ref: "§5",
    severite: "suggestion",
    titre: "Numérotation en double dans une série de subdivisions",
    explication:
      "Les subdivisions d'une même série sont numérotées de façon continue et sans doublon. Deux subdivisions consécutives portant le même numéro (par exemple « II » répété) signalent une erreur de séquence.",
    exempleKo: "I. – …\nII. – …\nII. – …",
    exempleOk: "I. – …\nII. – …\nIII. – …",
    detecteur: detecteNumerotationDupliquee,
  }),
  regleAlineas({
    id: "R6-01",
    ref: "§6",
    severite: "enfreinte",
    titre: "Guillemet ouvrant manquant dans un bloc rédigé",
    explication: "Tout alinéa rédigé commence par des guillemets.",
    exempleKo:
      "L'article 2 est complété par deux alinéas ainsi rédigés :\n« Le premier alinéa est applicable.\nLe second alinéa est applicable. »",
    exempleOk:
      "L'article 2 est complété par deux alinéas ainsi rédigés :\n« Le premier alinéa est applicable.\n« Le second alinéa est applicable. »",
    detecteur: detecteGuillemetOuvrantManquant,
  }),
  regleAlineas({
    id: "R6-02",
    ref: "§6",
    severite: "enfreinte",
    titre: "Guillemet fermant avant la fin du bloc rédigé",
    explication:
      "Seul le dernier alinéa faisant partie d'un bloc rédigé, sans interruption, est clos par des guillemets.",
    exempleKo:
      "L'article 2 est complété par deux alinéas ainsi rédigés :\n« Le premier alinéa est applicable. »\n« Le second alinéa est applicable. »",
    exempleOk:
      "L'article 2 est complété par deux alinéas ainsi rédigés :\n« Le premier alinéa est applicable.\n« Le second alinéa est applicable. »",
    detecteur: detecteGuillemetFermantPrecoce,
  }),
];
