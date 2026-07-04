import type { Detection, Regle } from "./types";
import { detecteurRegex } from "@/lib/engine/regex";

const G = "(?<![A-Za-zÀ-ÿ])"; // début de mot
const D = "(?![A-Za-zÀ-ÿ])"; // fin de mot

function regle(r: Omit<Regle, "famille">): Regle {
  return { famille: "Typographie", ...r };
}

// R7.2-02 — sigles en majuscules, à l'exclusion des chiffres romains (en contexte de division) et des exceptions
const EXCEPTIONS_SIGLES = new Set([
  "OSEO",
  "CHAPITRE",
  "TITRE",
  "LIVRE",
  "SECTION",
  "PARTIE",
  "DISPOSITIONS",
]);

// Mots de division qui, suivis d'un chiffre romain, en font un numéral (et non un sigle).
const MOTS_DIVISION =
  "chapitres?|titres?|livres?|sections?|sous-sections?|parties?|articles?|paragraphes?";

// Un token composé uniquement des lettres romaines {I,V,X,L,C,D,M} n'est écarté
// que s'il est réellement un numéral, c'est-à-dire précédé (à une espace près)
// d'un mot de division. Sinon, un tel token est un sigle potentiel (ex. CDD, CDI, CIV).
const DIVISION_ROMAINE_RE = new RegExp(`(?:${MOTS_DIVISION}) [IVXLCDM]+$`, "i");

const SIGLE_RE = new RegExp(`${G}[A-ZÀ-Ý]{2,}${D}`, "g");

function detecteSigles(texte: string): Detection[] {
  const out: Detection[] = [];
  const re = new RegExp(SIGLE_RE.source, SIGLE_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(texte)) !== null) {
    const mot = m[0];
    const estRomain = /^[IVXLCDM]+$/.test(mot);
    if (estRomain) {
      const precedent = texte.slice(0, m.index + mot.length);
      const precedeDivision = DIVISION_ROMAINE_RE.test(precedent);
      // Marqueur de paragraphe/subdivision en tête de ligne (ex. « II. – »,
      // « III. – ») : le token débute sa ligne et est immédiatement suivi
      // d'un point. Il s'agit alors d'un numéral, pas d'un sigle.
      const debutDeLigne = /(^|\n)\s*$/.test(texte.slice(0, m.index));
      const suiviDePoint = texte[m.index + mot.length] === ".";
      const estMarqueurDeLigne = debutDeLigne && suiviDePoint;
      if (precedeDivision || estMarqueurDeLigne) {
        if (m.index === re.lastIndex) re.lastIndex++;
        continue;
      }
    }
    // Un sigle à proscrire apparaît dans de la prose : « la CNIL est saisie »,
    // « un contrat CDD ». On ne le signale donc que s'il est précédé, sur sa
    // ligne, d'un mot commençant par une minuscule (article, préposition, nom
    // commun). Cela écarte les en-têtes, titres et blocs de signatures en
    // capitales d'un texte réel (« ASSEMBLÉE NATIONALE », « M. Thibault BAZIN »,
    // « EXPOSÉ DES MOTIFS », « MESDAMES, MESSIEURS ») sans manquer les vrais
    // sigles noyés dans une phrase.
    const debutLigne = texte.lastIndexOf("\n", m.index - 1) + 1;
    const avant = texte.slice(debutLigne, m.index);
    const motPrecedent = avant.match(/([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]*)[\s'’,(]*$/);
    const enProse = !!motPrecedent && /^[a-zà-ÿ]/.test(motPrecedent[1]);
    if (enProse && !EXCEPTIONS_SIGLES.has(mot)) {
      out.push({
        span: { start: m.index, end: m.index + mot.length },
        extrait: mot,
        message:
          "Les sigles sont à proscrire, sauf lorsqu'il s'agit du qualificatif exact de l'organisme concerné.",
      });
    }
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}

// R7.2-04 — majuscules non accentuées : « Etat(s) » et « A » en tête de phrase
const ETAT_RE = /(?<![A-Za-zÀ-ÿ])Etats?(?![a-zà-ÿ])/g;
// « A » n'est corrigé en « À » qu'en tête de phrase : précédé (à des espaces
// près) du début du texte, d'un saut de ligne, ou d'une ponctuation de fin de
// phrase (. ! ? : » «). Cela évite de corriger le verbe « avoir » en emploi
// médian (« Le préfet A le pouvoir »).
const A_ACCENT_RE =
  /(?<=^[ \t]*|[\n.!?:»«][ \t]*)A (la|l'|le|les|compter|cette|ce|défaut|titre)/g;

function detecteMajusculesNonAccentuees(texte: string): Detection[] {
  const out: Detection[] = [];

  const reEtat = new RegExp(ETAT_RE.source, ETAT_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = reEtat.exec(texte)) !== null) {
    const mot = m[0];
    const suggestion = mot.endsWith("s") ? "États" : "État";
    out.push({
      span: { start: m.index, end: m.index + mot.length },
      extrait: mot,
      message: "Les majuscules sont accentuées : on écrit « État », pas « Etat ».",
      suggestion,
    });
    if (m.index === reEtat.lastIndex) reEtat.lastIndex++;
  }

  const reA = new RegExp(A_ACCENT_RE.source, A_ACCENT_RE.flags);
  while ((m = reA.exec(texte)) !== null) {
    out.push({
      span: { start: m.index, end: m.index + m[0].length },
      extrait: m[0],
      message: "Les majuscules sont accentuées : on écrit « À », pas « A ».",
      suggestion: `À ${m[1]}`,
    });
    if (m.index === reA.lastIndex) reA.lastIndex++;
  }

  return out.sort((a, b) => a.span.start - b.span.start);
}

// R7.2-07 — locutions latines
const LOCUTIONS_LATINES = [
  "in fine",
  "a fortiori",
  "a contrario",
  "de facto",
  "de jure",
  "mutatis mutandis",
  "ratione materiae",
  "ratione loci",
  "in situ",
];

export const TYPOGRAPHIE: Regle[] = [
  regle({
    id: "R7.2-01",
    ref: "§7.2",
    severite: "enfreinte",
    titre: "Parenthèses proscrites",
    explication:
      "Les parenthèses sont proscrites. Dans la plupart des cas, elles peuvent être remplacées par des virgules.",
    exempleKo: "la commission (créée en 2020) statue",
    exempleOk: "la commission, créée en 2020, statue",
    detecteur: detecteurRegex(/\([^)\n]{1,120}\)/g, {
      message: "Les parenthèses sont proscrites ; les remplacer le plus souvent par des virgules.",
    }),
  }),
  regle({
    id: "R7.2-02",
    ref: "§7.2",
    severite: "a_revoir",
    titre: "Sigles à proscrire",
    explication:
      "Les sigles sont à proscrire, même entre parenthèses, sauf lorsqu'il s'agit du qualificatif exact de l'organisme concerné (par exemple « OSEO » ou « l'Unédic »). Une vérification manuelle est recommandée.",
    exempleKo: "la CNIL est consultée",
    exempleOk: "la Commission nationale de l'informatique et des libertés est consultée",
    detecteur: detecteSigles,
  }),
  regle({
    id: "R7.2-03",
    ref: "§7.2",
    severite: "enfreinte",
    titre: "Guillemets anglais proscrits",
    explication:
      "Chaque élément cité l'est entre guillemets « français », sauf à l'intérieur de guillemets français (auquel cas les guillemets deviennent \"anglais\"). Les guillemets anglais utilisés en dehors de ce cas sont à proscrire.",
    exempleKo: 'les mots : "deux ans" sont supprimés',
    exempleOk: "les mots : « deux ans » sont supprimés",
    detecteur: detecteurRegex(/"/g, {
      message:
        "Les citations se font entre guillemets « français », sauf à l'intérieur de guillemets français.",
    }),
  }),
  regle({
    id: "R7.2-04",
    ref: "§7.2",
    severite: "enfreinte",
    titre: "Majuscules non accentuées",
    explication:
      "Les majuscules sont accentuées : on écrit « État » (et non « Etat ») et « À » en début de phrase (et non « A »).",
    exempleKo: "un Etat membre ; A la première phrase",
    exempleOk: "un État membre ; À la première phrase",
    detecteur: detecteMajusculesNonAccentuees,
  }),
  regle({
    id: "R7.2-05",
    ref: "§7.2",
    severite: "enfreinte",
    titre: "Nombres à points proscrits",
    explication:
      "Les nombres ne comportent jamais de point : les milliers sont séparés par une espace, pas par un point.",
    exempleKo: "1.205.632 €",
    exempleOk: "1 205 632 €",
    detecteur: detecteurRegex(/(?<![\d.])\d{1,3}(?:\.\d{3})+(?!\d)/g, {
      message: "Les nombres ne comportent jamais de point ; séparer les milliers par une espace.",
      suggestion: (m) => m[0].replaceAll(".", " "),
    }),
  }),
  regle({
    id: "R7.2-06",
    ref: "§7.2",
    severite: "a_revoir",
    titre: "Nombres en chiffres pour les durées et les personnes",
    explication:
      "Les nombres s'écrivent en toutes lettres lorsqu'il s'agit de personnes (sauf les « habitants ») ou de durées : « cent vingt salariés », « trois ans ».",
    exempleKo: "une peine de 3 ans",
    exempleOk: "une peine de trois ans",
    detecteur: detecteurRegex(
      new RegExp(
        `${G}\\d+\\s+(ans?|mois|salariés?|personnes?|agents?|députés?|sénateurs?)${D}`,
        "g",
      ),
      {
        message:
          "Les nombres s'écrivent en toutes lettres pour les personnes et les durées.",
      },
    ),
  }),
  regle({
    id: "R7.2-07",
    ref: "§7.2",
    severite: "suggestion",
    titre: "Locutions latines à éviter",
    explication:
      "Les mots latins sont à éviter dans la mesure du possible, de même que les mots en langue étrangère.",
    exempleKo: "les dispositions in fine du texte",
    exempleOk: "les dispositions à la fin du texte",
    detecteur: detecteurRegex(
      new RegExp(`${G}(${LOCUTIONS_LATINES.join("|")})${D}`, "gi"),
      {
        message: "Les locutions latines sont à éviter dans la mesure du possible.",
      },
    ),
  }),
];
