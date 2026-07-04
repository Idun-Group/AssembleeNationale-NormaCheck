import type { Detection, Regle } from "./types";
import { detecteurRegex } from "@/lib/engine/regex";

const G = "(?<![A-Za-zÀ-ÿ])"; // début de mot
const D = "(?![A-Za-zÀ-ÿ])"; // fin de mot

// Même classe que dans references.ts : le « gap » entre deux mots-clés ne doit
// jamais franchir une frontière de phrase (point suivi d'espace + majuscule),
// tout en tolérant les abréviations (« L. 212-3 », « n° 58-1100 »).
const SEPARATEUR = `(?:[^.;:\\n]|\\.(?!\\s+[A-ZÀ-Ý]))`;

function regleCoherence(r: Omit<Regle, "famille">): Regle {
  return { famille: "Cohérence du dispositif", ...r };
}

function regleRecevabilite(r: Omit<Regle, "famille">): Regle {
  return { famille: "Recevabilité et procédure", ...r };
}

// ---------------------------------------------------------------------------
// Découpage en phrases pour RT-02 / RT-03 : les bornes sont « ; », « : », le
// saut de ligne, ou un point de fin de phrase (suivi d'espace + majuscule ou
// guillemet ouvrant) — cohérent avec SEPARATEUR.
function phraseAutour(texte: string, idx: number): { debut: number; fin: number } {
  const re = /[;:\n]|\.(?=\s+[A-ZÀ-Ý«])/g;
  let debut = 0;
  let fin = texte.length;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texte))) {
    if (m.index < idx) debut = m.index + 1;
    else {
      fin = m.index + 1;
      break;
    }
  }
  return { debut, fin };
}

// Formule de demande de rapport : verbe actif (remettre, transmettre,
// adresser, déposer, présenter) suivi — dans la même phrase — du mot
// « rapport ». Le caractère parlementaire est vérifié au niveau de la phrase.
const RE_DEMANDE_RAPPORT = new RegExp(
  `${G}(?:remet(?:tent)?|présente(?:nt)?|transmet(?:tent)?|adresse(?:nt)?|dépose(?:nt)?)(?:${SEPARATEUR}){0,160}?rapports?${D}`,
  "gi",
);

const RE_PERIODICITE =
  /chaque année|chaque semestre|tous les\s+(?:[a-zà-ÿ]+\s+)?ans|annuellement|semestriellement|trimestriellement|rapports? annuels?/i;
const RE_DELAI =
  /avant le|au plus tard|dans un délai|dans les\s+(?:[a-zà-ÿ]+\s+)?mois|à compter d/i;
const RE_DUREE = /pendant|pour une durée|jusqu'|durant/i;

interface DemandeRapport {
  span: { start: number; end: number };
  extrait: string;
  phrase: string;
}

// Récupère les demandes de rapport AU PARLEMENT (une par phrase).
function demandesRapportParlement(texte: string): DemandeRapport[] {
  const out: DemandeRapport[] = [];
  const phrasesVues = new Set<number>();
  for (const m of texte.matchAll(RE_DEMANDE_RAPPORT)) {
    const { debut, fin } = phraseAutour(texte, m.index);
    if (phrasesVues.has(debut)) continue; // une seule alerte par phrase
    const phrase = texte.slice(debut, fin);
    if (!/Parlement/.test(phrase)) continue;
    phrasesVues.add(debut);
    out.push({
      span: { start: m.index, end: m.index + m[0].length },
      extrait: m[0],
      phrase,
    });
  }
  return out;
}

// RT-02 — demande de rapport ponctuelle sans délai de remise.
function detecteRapportSansDelai(texte: string): Detection[] {
  const out: Detection[] = [];
  for (const d of demandesRapportParlement(texte)) {
    if (RE_PERIODICITE.test(d.phrase)) continue; // périodique : affaire de RT-03
    if (RE_DELAI.test(d.phrase)) continue; // délai présent : conforme
    out.push({
      span: d.span,
      extrait: d.extrait,
      message:
        "Demande de rapport sans délai de remise : préciser l'échéance (par exemple « dans un délai de six mois à compter de la promulgation de la présente loi »).",
    });
  }
  return out;
}

// RT-03 — rapport périodique sans limitation de durée (caducité).
function detecteRapportPeriodiqueSansDuree(texte: string): Detection[] {
  const out: Detection[] = [];
  for (const d of demandesRapportParlement(texte)) {
    if (!RE_PERIODICITE.test(d.phrase)) continue;
    if (RE_DUREE.test(d.phrase)) continue; // durée bornée : conforme
    out.push({
      span: d.span,
      extrait: d.extrait,
      message:
        "Rapport périodique demandé sans limitation de durée : l'obligation s'expose à l'abrogation automatique prévue à l'article 4 ter de l'ordonnance n° 58-1100 du 17 novembre 1958. Borner l'obligation dans le temps.",
    });
  }
  return out;
}

export const COHERENCE: Regle[] = [
  regleRecevabilite({
    id: "RT-01",
    ref: "§PPL-PAR-SEP-001",
    severite: "a_revoir",
    titre: "Injonction au Gouvernement de déposer un projet de loi",
    explication:
      "La loi ne peut adresser d'injonction au Gouvernement, notamment lui imposer le dépôt d'un projet de loi : l'initiative des lois du Premier ministre (article 39 de la Constitution) et la séparation des pouvoirs s'y opposent. Une telle disposition encourt la censure du Conseil constitutionnel.",
    exempleKo:
      "Le Gouvernement dépose au Parlement, avant le 1er janvier 2027, un projet de loi réformant le régime concerné.",
    exempleOk:
      "Le Gouvernement remet au Parlement, avant le 1er janvier 2027, un rapport sur l'opportunité d'une réforme du régime concerné.",
    detecteur: detecteurRegex(
      new RegExp(
        `${G}Gouvernement\\s+(?:dépose(?:ra)?|présente(?:ra)?|soumet(?:tra)?|est tenu de (?:déposer|présenter|soumettre))(?:${SEPARATEUR}){0,80}?(?<!au )(?<!du )projet de loi(?! de (?:ratification|finances|financement))`,
        "g",
      ),
      {
        message:
          "Injonction au Gouvernement de déposer un projet de loi : contraire à la séparation des pouvoirs et à l'article 39 de la Constitution (initiative gouvernementale).",
      },
    ),
    llm: "Repérer toute disposition qui adresse une injonction au Gouvernement ou à une autre autorité constitutionnelle : obligation de déposer ou de présenter un projet de loi, d'engager une réforme, de prendre une initiative diplomatique… (les demandes de rapport au Parlement ne sont PAS des injonctions au sens de ce contrôle, ni le dépôt d'un projet de loi de ratification d'une ordonnance). Citer le passage exact.",
  }),
  regleCoherence({
    id: "RT-02",
    ref: "§PPL-MAT-NOR-018",
    severite: "a_revoir",
    titre: "Demande de rapport au Parlement sans délai de remise",
    explication:
      "Une disposition demandant au Gouvernement la remise d'un rapport au Parlement doit préciser son échéance (délai ou date), faute de quoi l'obligation est dépourvue de fait déclencheur et reste lettre morte.",
    exempleKo: "Le Gouvernement remet au Parlement un rapport sur l'application de la présente loi.",
    exempleOk:
      "Le Gouvernement remet au Parlement, dans un délai de six mois à compter de la promulgation de la présente loi, un rapport sur son application.",
    detecteur: detecteRapportSansDelai,
  }),
  regleCoherence({
    id: "RT-03",
    ref: "§PPL-MAT-NOR-031",
    severite: "a_revoir",
    titre: "Rapport périodique au Parlement sans limitation de durée",
    explication:
      "Une obligation de remise périodique d'un rapport du Gouvernement au Parlement doit être bornée dans le temps : à défaut, elle s'expose à l'abrogation automatique prévue à l'article 4 ter de l'ordonnance n° 58-1100 du 17 novembre 1958 relative au fonctionnement des assemblées parlementaires.",
    exempleKo:
      "Le Gouvernement remet chaque année au Parlement un rapport sur la mise en œuvre du dispositif.",
    exempleOk:
      "Le Gouvernement remet chaque année au Parlement, pendant une durée de cinq ans, un rapport sur la mise en œuvre du dispositif.",
    detecteur: detecteRapportPeriodiqueSansDuree,
  }),
];
