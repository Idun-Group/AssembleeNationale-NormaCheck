import type { Regle } from "./types";
import { detecteurRegex } from "@/lib/engine/regex";

const G = "(?<![A-Za-zÀ-ÿ])"; // début de mot
const D = "(?![A-Za-zÀ-ÿ])"; // fin de mot

function regle(r: Omit<Regle, "famille">): Regle {
  return { famille: "Formules standard", ...r };
}

export const FORMULES_STANDARD: Regle[] = [
  regle({
    id: "R9.2-01",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« et/ou » est proscrit",
    explication:
      "La formule « et/ou » n'a pas sa place dans un texte normatif : le « ou » juridique n'est pas exclusif.",
    exempleKo: "le maire et/ou le préfet",
    exempleOk: "le maire ou le préfet",
    detecteur: detecteurRegex(new RegExp(`${G}et/ou${D}`, "g"), {
      message: "La formule « et/ou » est à proscrire.",
      suggestion: "ou",
    }),
  }),
  regle({
    id: "R9.2-02",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« communautaire » → « européen »",
    explication:
      "Depuis le traité de Lisbonne, on écrit « européen » ou « de l'Union européenne », plus « communautaire ».",
    exempleKo: "le droit communautaire",
    exempleOk: "le droit européen",
    detecteur: detecteurRegex(new RegExp(`${G}communautaires?${D}`, "g"), {
      message: "« communautaire » ne doit plus être employé pour l'Union européenne.",
      suggestion: "européen",
    }),
  }),
  regle({
    id: "R9.2-03",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« montant maximum » → « montant maximal »",
    explication:
      "Le guide de légistique retient l'adjectif « maximal » (et son pluriel « maximaux ») plutôt que l'emploi adjectival du nom « maximum ».",
    exempleKo: "le montant maximum de l'aide",
    exempleOk: "le montant maximal de l'aide",
    detecteur: detecteurRegex(
      new RegExp(`${G}([A-Za-zÀ-ÿ]+) maximums?${D}`, "g"),
      {
        message: "On préfère « maximal » à « maximum » employé comme adjectif.",
        suggestion: (m) => `${m[1]} maximal`,
      },
    ),
  }),
  regle({
    id: "R9.2-04",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« visé à/au/aux » → « mentionné à/au/aux »",
    explication:
      "Pour renvoyer à un article, on emploie « mentionné » plutôt que « visé », qui est ambigu (le verbe « viser » ayant d'autres sens juridiques, notamment dans les visas d'un acte).",
    exempleKo: "le décret visé à l'article 3",
    exempleOk: "le décret mentionné à l'article 3",
    detecteur: detecteurRegex(new RegExp(`${G}visé(e?s?) (à|au|aux)${D}`, "g"), {
      message: "« visé » est à remplacer par « mentionné » pour renvoyer à un article.",
      suggestion: (m) => `mentionné${m[1]} ${m[2]}`,
    }),
  }),
  regle({
    id: "R9.2-05",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« prévu par l'article » → « prévu à l'article »",
    explication:
      "Le guide de légistique retient la préposition « à » : « prévu à l'article 20 » plutôt que « prévu par l'article 20 ».",
    exempleKo: "prévu par l'article 20",
    exempleOk: "prévu à l'article 20",
    detecteur: detecteurRegex(new RegExp(`${G}prévue?s? par l'article${D}`, "g"), {
      message: "On écrit « prévu à l'article » et non « prévu par l'article ».",
      suggestion: "prévu à l'article",
    }),
  }),
  regle({
    id: "R9.2-06",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« ministre en charge de » → « ministre chargé de »",
    explication:
      "Le guide de légistique retient « ministre chargé des sports » plutôt que « ministre en charge des sports ». Les ministres régaliens conservent leur appellation traditionnelle.",
    exempleKo: "le ministre en charge des sports",
    exempleOk: "le ministre chargé des sports",
    detecteur: detecteurRegex(new RegExp(`${G}ministre en charge d(e la|e l'|es|u|e)${D}`, "g"), {
      message: "On écrit « ministre chargé de » et non « ministre en charge de ».",
      suggestion: (m) => `ministre chargé d${m[1]}`,
    }),
  }),
  regle({
    id: "R9.2-07",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« dans les conditions fixées par décret » → « dans des conditions fixées par décret »",
    explication:
      "Le guide de légistique retient l'article indéfini : « dans des conditions fixées par décret » plutôt que « dans les conditions fixées par décret ».",
    exempleKo: "dans les conditions fixées par décret",
    exempleOk: "dans des conditions fixées par décret",
    detecteur: detecteurRegex(new RegExp(`${G}dans les conditions fixées par décret${D}`, "g"), {
      message: "On écrit « dans des conditions fixées par décret ».",
      suggestion: "dans des conditions fixées par décret",
    }),
  }),
  regle({
    id: "R9.2-08",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« collectivités locales » → « collectivités territoriales »",
    explication:
      "L'expression consacrée par la Constitution et employée dans les textes normatifs est « collectivités territoriales », non « collectivités locales ».",
    exempleKo: "les collectivités locales",
    exempleOk: "les collectivités territoriales",
    detecteur: detecteurRegex(new RegExp(`${G}collectivités locales${D}`, "g"), {
      message: "On écrit « collectivités territoriales » et non « collectivités locales ».",
      suggestion: "collectivités territoriales",
    }),
  }),
  regle({
    id: "R9.2-09",
    ref: "§9.2",
    severite: "a_revoir",
    titre: "« accusé de réception » → « lettre avec demande d'avis de réception »",
    explication:
      "Le guide de légistique préconise « lettre avec demande d'avis de réception » plutôt que « accusé de réception », terme postal impropre en la matière. Une vérification manuelle du contexte est recommandée.",
    exempleKo: "lettre avec accusé de réception",
    exempleOk: "lettre avec demande d'avis de réception",
    detecteur: detecteurRegex(new RegExp(`${G}accusé de réception${D}`, "g"), {
      message: "« accusé de réception » est à remplacer par « lettre avec demande d'avis de réception ».",
      suggestion: "lettre avec demande d'avis de réception",
    }),
  }),
  regle({
    id: "R9.2-10",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« conformément à l'article » → « en application de l'article »",
    explication:
      "On préfère « en application de l'article » à « conformément à l'article », sauf lorsque la norme visée est supérieure à la loi (par exemple un article de la Constitution).",
    exempleKo: "conformément à l'article L. 3 du code civil",
    exempleOk: "conformément à l'article 13 de la Constitution",
    detecteur: detecteurRegex(
      new RegExp(
        `${G}conformément à(?! l'article \\d+ de la Constitution)(?! la Constitution)${D}`,
        "g",
      ),
      {
        message: "On préfère « en application de » à « conformément à », sauf norme supra-législative.",
        suggestion: "en application de",
      },
    ),
  }),
  regle({
    id: "R9.2-11",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« le ou les » → « les »",
    explication:
      "La formule « le ou les » est redondante en français juridique : le pluriel « les » couvre déjà le cas d'un ou plusieurs éléments.",
    exempleKo: "le ou les représentants",
    exempleOk: "les représentants",
    detecteur: detecteurRegex(new RegExp(`${G}le ou les${D}`, "g"), {
      message: "« le ou les » est redondant : on écrit simplement « les ».",
      suggestion: "les",
    }),
  }),
  regle({
    id: "R9.2-12",
    ref: "§9.2",
    severite: "suggestion",
    titre: "« Journal officiel de la République française » → « Journal officiel »",
    explication:
      "La forme abrégée « Journal officiel » suffit, sauf si le contexte impose de lever une ambiguïté avec un autre journal officiel (par exemple celui de l'Union européenne).",
    exempleKo: "au Journal officiel de la République française",
    exempleOk: "au Journal officiel",
    detecteur: detecteurRegex(new RegExp(`${G}Journal officiel de la République française${D}`, "g"), {
      message: "La forme abrégée « Journal officiel » est suffisante, sauf risque de confusion.",
      suggestion: "Journal officiel",
    }),
  }),
  regle({
    id: "R9.2-13",
    ref: "§9.2",
    severite: "a_revoir",
    titre: "« préfet » → « représentant de l'État dans le département »",
    explication:
      "Dans un texte normatif, on désigne le préfet par la formule « représentant de l'État dans le département ». Le mot « préfet » peut cependant rester légitime hors contexte strictement normatif, d'où une vérification au cas par cas.",
    exempleKo: "le préfet du département",
    exempleOk: "le représentant de l'État dans le département",
    detecteur: detecteurRegex(new RegExp(`${G}préfet(s?)${D}`, "g"), {
      message: "On préfère « représentant de l'État dans le département » à « préfet ».",
      suggestion: (m) =>
        m[1] === "s"
          ? "représentants de l'État dans le département"
          : "représentant de l'État dans le département",
    }),
  }),
  regle({
    id: "R9.2-14",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« par un décret en Conseil d'État » → « par décret en Conseil d'État »",
    explication:
      "La forme passive sans article indéfini est préférable : « fixée par décret en Conseil d'État » plutôt que « fixée par un décret en Conseil d'État ».",
    exempleKo: "fixée par un décret en Conseil d'État",
    exempleOk: "fixée par décret en Conseil d'État",
    detecteur: detecteurRegex(new RegExp(`${G}par un décret en Conseil d'État${D}`, "g"), {
      message: "On écrit « par décret en Conseil d'État », sans article indéfini.",
      suggestion: "par décret en Conseil d'État",
    }),
  }),
  regle({
    id: "R9.2-15",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« projets de lois de finances » → « projets de loi de finances »",
    explication:
      "L'expression « loi de finances » reste au singulier même précédée de « projets » : on écrit « projets de loi de finances ».",
    exempleKo: "les projets de lois de finances",
    exempleOk: "les projets de loi de finances",
    detecteur: detecteurRegex(new RegExp(`${G}projets de lois de finances${D}`, "g"), {
      message: "On écrit « projets de loi de finances » (« loi » au singulier).",
      suggestion: "projets de loi de finances",
    }),
  }),
  regle({
    id: "R9.2-16",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« loi de finances initiale » → « loi de finances de l'année »",
    explication:
      "Le guide de légistique retient la dénomination « loi de finances de l'année » plutôt que « loi de finances initiale ».",
    exempleKo: "la loi de finances initiale",
    exempleOk: "la loi de finances de l'année",
    detecteur: detecteurRegex(new RegExp(`${G}loi de finances initiale${D}`, "g"), {
      message: "On écrit « loi de finances de l'année » plutôt que « loi de finances initiale ».",
      suggestion: "loi de finances de l'année",
    }),
  }),
  regle({
    id: "R9.2-17",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« garde des sceaux, ministre de la justice » → « ministre de la justice »",
    explication:
      "Les ministres régaliens conservent leur appellation traditionnelle : on écrit simplement « ministre de la justice », sans faire précéder cette dénomination de « garde des sceaux ».",
    exempleKo: "le garde des sceaux, ministre de la justice",
    exempleOk: "le ministre de la justice",
    detecteur: detecteurRegex(new RegExp(`${G}garde des sceaux, ministre de la justice${D}`, "g"), {
      message: "On écrit « ministre de la justice », sans « garde des sceaux, ».",
      suggestion: "ministre de la justice",
    }),
  }),
  regle({
    id: "R9.2-18",
    ref: "§9.2",
    severite: "enfreinte",
    titre: "« annexe du livre » → « annexe au livre »",
    explication:
      "Le guide de légistique retient la préposition « à » : « annexe au livre Ier » plutôt que « annexe du livre Ier ».",
    exempleKo: "l'annexe du livre Ier",
    exempleOk: "l'annexe au livre Ier",
    detecteur: detecteurRegex(new RegExp(`${G}annexe du livre${D}`, "g"), {
      message: "On écrit « annexe au livre » et non « annexe du livre ».",
      suggestion: "annexe au livre",
    }),
  }),
];
