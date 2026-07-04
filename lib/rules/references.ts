import type { Regle } from "./types";
import { detecteurRegex } from "@/lib/engine/regex";

const G = "(?<![A-Za-zÀ-ÿ])"; // début de mot
const D = "(?![A-Za-zÀ-ÿ])"; // fin de mot

// Classe de caractères pour le texte séparant le nom (alinéa/article/…) du
// verbe (est/sont) dans les règles 8.3-01/02 : on exclut les ponctuations
// fortes (; : saut de ligne) mais on garde le point, car les abréviations
// courantes (« L. 212-3 », « art. ») contiennent un point suivi d'une espace.
// Le point n'est toléré que s'il n'est PAS une fin de phrase : on interdit
// qu'il soit suivi d'une espace puis d'une majuscule (ce qui arrêterait le
// gap à une frontière de phrase, évitant qu'il chevauche deux phrases,
// par ex. « … modifié. L'article … »), tout en laissant passer les
// abréviations comme « L. 212-3 » (point suivi d'une espace puis d'un chiffre).
const SEPARATEUR = `(?:[^.;:\\n]|\\.(?!\\s+[A-ZÀ-Ý]))`;

function regleReferences(r: Omit<Regle, "famille">): Regle {
  return { famille: "Références", ...r };
}

function regleModifications(r: Omit<Regle, "famille">): Regle {
  return { famille: "Modifications de la norme", ...r };
}

export const REFERENCES: Regle[] = [
  regleReferences({
    id: "R9.1-01",
    ref: "§9.1",
    severite: "enfreinte",
    titre: "« l'article/l'alinéa précédent/suivant » proscrit",
    explication:
      "On veille à ne pas renvoyer à « l'article suivant » ou « précédent » : le renvoi se fait directement au numéro de l'article ou de l'alinéa (par exemple « le deuxième alinéa »).",
    exempleKo: "comme prévu à l'alinéa précédent",
    exempleOk: "comme prévu au deuxième alinéa",
    detecteur: detecteurRegex(
      new RegExp(`${G}(l'|à l'|de l')(alinéa|article) (précédent|suivant)${D}`, "gi"),
      {
        message:
          "On ne renvoie pas à « l'article/l'alinéa précédent/suivant » : le renvoi se fait directement au numéro.",
      },
    ),
  }),
  regleReferences({
    id: "R9.1-02",
    ref: "§9.1",
    severite: "enfreinte",
    titre: "« ci-dessus » / « les dispositions qui précèdent » proscrits",
    explication:
      "On évite les expressions imprécises « ci-dessus », « ci-dessous » ou « les dispositions qui précèdent », auxquelles on préfère par exemple « le deuxième alinéa ».",
    exempleKo: "les dispositions ci-dessus",
    exempleOk: "les dispositions mentionnées au deuxième alinéa",
    detecteur: detecteurRegex(
      new RegExp(`${G}(ci-dessus|ci-dessous|les dispositions qui précèdent)${D}`, "gi"),
      {
        message:
          "Les expressions « ci-dessus », « ci-dessous » et « les dispositions qui précèdent » sont imprécises ; on préfère un renvoi précis (par exemple « le deuxième alinéa »).",
      },
    ),
  }),
  regleReferences({
    id: "R9.1-03",
    ref: "§9.1",
    severite: "a_revoir",
    titre: "« la présente disposition » / « ces dispositions » imprécis",
    explication:
      "Pour les mêmes raisons, on évite les références imprécises « la présente disposition » ou « ces dispositions » et on préfère « le présent article » ou « le présent alinéa ».",
    exempleKo: "la présente disposition s'applique",
    exempleOk: "le présent article s'applique",
    detecteur: detecteurRegex(
      new RegExp(`${G}(la présente disposition|ces dispositions)${D}`, "gi"),
      {
        message:
          "On préfère « le présent article » ou « le présent alinéa » à « la présente disposition »/« ces dispositions ».",
      },
    ),
  }),
  regleModifications({
    id: "R8.1-01",
    ref: "§8.1",
    severite: "enfreinte",
    titre: "Le point d'impact est introduit par « à »/« au », non par « dans »",
    explication:
      "De façon générale, le point d'impact est introduit par les mots « à » ou « au » et non par le mot « dans ».",
    exempleKo: "Dans le premier alinéa de l'article 2, le mot est supprimé",
    exempleOk: "Au premier alinéa de l'article 2, le mot est supprimé",
    detecteur: detecteurRegex(
      new RegExp(`${G}Dans (le |la |l'|les )((?:[a-zà-ÿ-]+ ){0,3})(alinéas?|articles?|phrases?)`, "g"),
      {
        message:
          "Le point d'impact est introduit par « à » ou « au », et non par « dans ».",
        suggestion: (m) => {
          const prefixe =
            m[1] === "l'" ? "À l'" : m[1] === "les " ? "Aux " : m[1] === "la " ? "À la " : "Au ";
          return `${prefixe}${m[2]}${m[3]}`;
        },
      },
    ),
  }),
  regleModifications({
    id: "R8.3-01",
    ref: "§8.3",
    severite: "enfreinte",
    titre: "Un alinéa/une phrase/des mots se SUPPRIMENT (pas « abrogés »)",
    explication:
      "Les alinéas, phrases, mots, nombres, chiffres, taux, années, dates, montants et mentions sont supprimés, et non abrogés : l'abrogation ne concerne que les divisions, les articles ou les subdivisions d'article.",
    exempleKo: "Le deuxième alinéa est abrogé.",
    exempleOk: "Le deuxième alinéa est supprimé.",
    detecteur: detecteurRegex(
      new RegExp(
        `${G}(alinéas?|phrases?|mots?|nombres?|chiffres?|taux|années?|dates?|montants?|mentions?)(${SEPARATEUR}{0,40}?)(est|sont) abrogée?s?${D}`,
        "gi",
      ),
      {
        message:
          "Les alinéas, phrases, mots, nombres, chiffres, taux, années, dates, montants et mentions sont supprimés, et non abrogés.",
        suggestion: (m) => m[0].replace(/abrogé/gi, "supprimé"),
      },
    ),
  }),
  regleModifications({
    id: "R8.3-02",
    ref: "§8.3",
    severite: "enfreinte",
    titre: "Une division/un article/une subdivision s'ABROGE (pas « supprimé »)",
    explication:
      "Les divisions, les articles ou les subdivisions d'article sont abrogés, et non supprimés : la suppression ne concerne que les alinéas, phrases, mots, nombres, chiffres, taux, etc.",
    exempleKo: "L'article L. 212-3 est supprimé.",
    exempleOk: "L'article L. 212-3 est abrogé.",
    // Le nom (article/division…) doit être le SUJET de « est supprimé », pas un
    // complément : « le dernier alinéa DE L'article L. 228 est supprimé » vise
    // l'alinéa (qui, lui, se supprime légitimement), pas l'article. On écarte
    // donc « article » précédé de « de l'/du/de la/des ».
    detecteur: detecteurRegex(
      new RegExp(
        `${G}(?<![Dd]e l['’])(?<![àÀ] l['’])(?<![Dd]u )(?<![Aa]u )(?<![Dd]e la )(?<![àÀ] la )(?<![Dd]es )(?<![Aa]ux )(articles?|chapitres?|titres?|sections?|sous-sections?|livres?|parties?)(${SEPARATEUR}{0,40}?)(est|sont) supprimée?s?${D}`,
        "gi",
      ),
      {
        message:
          "Les divisions, les articles et les subdivisions d'article sont abrogés, et non supprimés.",
        suggestion: (m) => m[0].replace(/supprimé/gi, "abrogé"),
      },
    ),
  }),
  regleReferences({
    id: "R9.3-01",
    ref: "§9.3",
    severite: "a_revoir",
    titre: "Référence de texte incomplète (« loi n° du »)",
    explication:
      "Une référence à un texte doit comporter son numéro et sa date. Un « loi n° du » à blanc (numéro et date non renseignés) doit être complété avant l'adoption.",
    exempleKo: "modifiée par la loi n° du relative à la transition énergétique",
    exempleOk: "modifiée par la loi n° 2023-175 du 10 mars 2023 relative à la transition énergétique",
    detecteur: detecteurRegex(
      /(?:lois?|ordonnances?|décrets?)(?:\s+organiques?)?\s+n°\s+du\b/gi,
      {
        message:
          "Référence incomplète : le numéro et la date de la loi (ou de l'ordonnance/du décret) ne sont pas renseignés.",
      },
    ),
  }),
];
