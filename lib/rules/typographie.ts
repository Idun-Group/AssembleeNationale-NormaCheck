import type { Detection, Regle } from "./types";
import { detecteurRegex } from "@/lib/engine/regex";

const G = "(?<![A-Za-zÀ-ÿ])"; // début de mot
const D = "(?![A-Za-zÀ-ÿ])"; // fin de mot

function regle(r: Omit<Regle, "famille">): Regle {
  return { famille: "Typographie", ...r };
}

// R7.2-02 — sigles en majuscules, à l'exclusion des chiffres romains et des exceptions
const EXCEPTIONS_SIGLES = new Set([
  "OSEO",
  "CHAPITRE",
  "TITRE",
  "LIVRE",
  "SECTION",
  "PARTIE",
  "DISPOSITIONS",
]);

const SIGLE_RE = new RegExp(`${G}(?![IVXLCDM]+${D})[A-ZÀ-Ý]{2,}${D}`, "g");

function detecteSigles(texte: string): Detection[] {
  const out: Detection[] = [];
  const re = new RegExp(SIGLE_RE.source, SIGLE_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(texte)) !== null) {
    const mot = m[0];
    if (!EXCEPTIONS_SIGLES.has(mot)) {
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
const A_ACCENT_RE = /(?<![A-Za-zÀ-ÿ.])A (la|l'|le|les|compter|cette|ce|défaut|titre)/g;

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
    detecteur: detecteurRegex(/\d{1,3}(?:\.\d{3})+(?!\d)/g, {
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
