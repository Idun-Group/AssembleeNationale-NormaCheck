export interface Exemple {
  id: string;
  titre: string;
  description: string;
  texte: string;
  reglesAttendues: string[];
}

export const EXEMPLES: Exemple[] = [
  {
    id: "pedagogique",
    titre: "Texte pédagogique",
    description: "Un article court avec une infraction de chaque grande famille de règles.",
    texte: [
      "Article 1er",
      "I. Le code de la consommation est ainsi modifié :",
      "1° Dans le premier alinéa de l'article L. 121-1, les mots : \"pratiques commerciales\" sont remplacés par les mots : « pratiques et/ou usages » ;",
      "2° le deuxième alinéa du même article est abrogé.",
      "II. – Les collectivités locales et l'Etat (y compris la CNIL) transmettent le rapport visé à l'article 3 conformément à l'article L. 2 du code du sport, selon les modalités définies à l'alinéa précédent.",
    ].join("\n"),
    reglesAttendues: [
      "R5-01", "R8.1-01", "R7.2-03", "R9.2-01", "R5-03", "R8.3-01",
      "R9.2-08", "R7.2-04", "R7.2-01", "R7.2-02", "R9.2-04", "R9.2-10", "R9.1-01",
    ],
  },
  {
    id: "ppl",
    titre: "Extrait de proposition de loi",
    description: "Un extrait réaliste de PPL avec des infractions typiques disséminées.",
    texte: [
      "Proposition de loi relative à la sécurité des équipements sportifs",
      "",
      "Article 1er",
      "",
      "I. – Le code du sport est ainsi modifié :",
      "",
      "1° L'article L. 322-1 est ainsi modifié :",
      "",
      "a) Au premier alinéa, le mot : « exploitant » est remplacé par le mot : « gestionnaire » ;",
      "",
      "L'article L. 322-1 est complété par un alinéa ainsi rédigé :",
      "« Le gestionnaire d'un établissement d'activités physiques ou sportives affiche de manière visible les diplômes et/ou titres requis pour l'encadrement des activités proposées.",
      "Un décret en Conseil d'État précise les modalités de cet affichage. »",
      "",
      "2° Après l'article L. 322-1, il est inséré un article L. 322-1-1 ainsi rédigé :",
      "« Art. L. 322-1-1. – Le ministre en charge des sports fixe par arrêté le montant maximum de la subvention allouée à ce titre.",
      "« Les conditions d'application du présent article sont fixées par décret en Conseil d'État. »",
      "",
      "II. – Au deuxième alinéa de l'article L. 322-2 du même code, la référence : « L. 322-1 » est remplacée par la référence : « L. 322-1-1 ».",
      "",
      "Article 2",
      "",
      "A. – Le chapitre III du titre II du livre III du code du sport est complété par un article L. 323-3 ainsi rédigé :",
      "« Art. L. 323-3. – Les fédérations sportives délégataires transmettent chaque année à la Cour des comptes un rapport sur l'emploi des subventions perçues.",
      "« Ce rapport est rendu public dans des conditions fixées par décret. »",
      "",
      "B. – Les modalités d'application du présent article sont fixées par décret en Conseil d'État.",
    ].join("\n"),
    reglesAttendues: ["R9.2-01", "R9.2-03", "R6-01", "R9.2-06"],
  },
  {
    id: "llm",
    titre: "Cas d'analyse approfondie",
    description:
      "Peu de fautes mécaniques, mais un titre trop long, un « du même code » douteux et un point d'impact imprécis — le terrain de jeu de l'analyse IA.",
    texte: [
      "Proposition de loi visant à renforcer la transparence financière des fédérations sportives délégataires et à améliorer le contrôle exercé par l'État sur l'emploi des subventions publiques qui leur sont versées chaque année en application de l'article L. 131-8 du code du sport et des textes réglementaires pris pour son application",
      "",
      "Article 1er",
      "",
      "I. – Après l'article L. 131-8 du code du sport, il est inséré un article L. 131-8-1 ainsi rédigé :",
      "",
      "« Art. L. 131-8-1. – Les fédérations sportives délégataires transmettent chaque année au ministre chargé des sports un rapport détaillant l'emploi des subventions perçues au titre du présent code.",
      "",
      "« Ce rapport est établi selon un modèle fixé par arrêté.",
      "",
      "« Il précise notamment la répartition territoriale des aides accordées.",
      "",
      "« Le ministre chargé des sports transmet ce rapport à la Cour des comptes dans un délai de deux mois.",
      "",
      "« Les modalités d'application du présent article sont fixées par décret en Conseil d'État. » ;",
      "",
      "II. – Le code général des impôts est ainsi modifié :",
      "",
      "1° À l'article 132, les mots : « chaque année » sont remplacés par les mots : « chaque année civile » ;",
      "",
      "2° Le cinquième alinéa de l'article L. 131-8-1 du même code est complété par les mots : « et transmis à l'inspection générale de la jeunesse et des sports ».",
    ].join("\n"),
    reglesAttendues: [],
  },
];
