import type { Regle } from "./types";

export const REGLES_LLM: Regle[] = [
  {
    id: "RL-01",
    famille: "Titres",
    ref: "§1",
    severite: "a_revoir",
    titre: "Le titre doit être bref et sans références législatives",
    explication:
      "Le titre d'une loi résume son contenu. Les références législatives y sont proscrites (lourdeur, risque d'inexactitude).",
    exempleKo:
      "Proposition de loi visant à modifier l'article L. 121-1 du code de la consommation et diverses dispositions relatives à…",
    exempleOk: "Proposition de loi relative à la protection des consommateurs",
    llm: "Si le texte comporte un titre (première ligne ou ligne commençant par « Proposition de loi » / « Projet de loi »), vérifier qu'il est bref (< 30 mots) et ne contient aucune référence d'article (« L. 121-1 », « article 3 »…). Citer le titre exact.",
  },
  {
    id: "RL-02",
    famille: "Modifications de la norme",
    ref: "§8.1",
    severite: "a_revoir",
    titre: "Le point d'impact doit être le plus précis possible",
    explication:
      "Le point d'impact doit toujours précéder l'ordre des modifications législatives et être le plus précis possible (division, article, subdivision, alinéa, phrase, mot, date, nombre…). On évite les points d'impact vagues qui désignent une structure entière quand la modification ne porte que sur une partie de celle-ci.",
    exempleKo: "À l'article 2, les mots : « deux ans » sont remplacés par les mots : « trois ans ».",
    exempleOk:
      "À la seconde phrase du deuxième alinéa de l'article 2, les mots : « deux ans » sont remplacés par les mots : « trois ans ».",
    llm: "Pour chaque point d'impact introduisant une modification (« à l'article… », « au premier alinéa… », etc.), vérifier s'il désigne la structure la plus fine réellement concernée par la modification (alinéa, phrase, mot précis) plutôt qu'une structure englobante (ex : « à l'article 2 » alors que l'article comporte plusieurs alinéas et que seule une phrase ou un mot est modifié). Signaler les points d'impact insuffisamment précis en citant le passage exact et en proposant, si possible, une reformulation plus précise (ex : « à la seconde phrase du deuxième alinéa de l'article 2 »).",
  },
  {
    id: "RL-03",
    famille: "Références",
    ref: "§9.1",
    severite: "a_revoir",
    titre: "« du même code » et « la présente loi » employés à bon escient",
    explication:
      "Les expressions « du même code » ou « la présente loi » doivent être employées avec la plus grande circonspection : « du même code » doit renvoyer au code cité juste avant, et « la présente loi » est proscrite pour un article codifié inséré dans un code (on vise alors « le présent code » ou la loi n°… du… + son intitulé, selon le cas).",
    exempleKo:
      "L'article L. 313-1 du code de la construction et de l'habitation est complété par un alinéa ainsi rédigé : « Les modalités d'application du présent article sont fixées par un décret pris en application de la présente loi. »",
    exempleOk:
      "L'article L. 313-1 du code de la construction et de l'habitation est complété par un alinéa ainsi rédigé : « Les modalités d'application du présent article sont fixées par un décret pris en application du présent code. »",
    llm: "Repérer chaque occurrence de « du même code » et vérifier qu'elle renvoie bien au code mentionné dans la référence immédiatement antérieure (et non à un autre code cité plus tôt ou pas du tout). Repérer chaque occurrence de « la présente loi » et vérifier qu'elle n'apparaît pas au sein d'une disposition destinée à être codifiée (article de code) — dans ce cas, elle doit être remplacée par « le présent code » ou par la référence complète « loi n°… du… » selon le contexte. Citer le passage exact incriminé.",
  },
  {
    id: "RL-04",
    famille: "Modifications de la norme",
    ref: "§8.1",
    severite: "a_revoir",
    titre: "« Le dernier alinéa » plutôt qu'un numéro d'ordre",
    explication:
      "S'agissant des alinéas (ou des phrases), on mentionne « le dernier alinéa » et non son numéro d'ordre (ex : « le cinquième alinéa »). On mentionne « le second alinéa » lorsque l'article n'en comporte que deux, et « l'avant-dernier alinéa » plutôt que son numéro lorsqu'il y en a plus de quatre.",
    exempleKo: "Le cinquième alinéa de l'article L. 2 est complété par une phrase ainsi rédigée :",
    exempleOk: "Le dernier alinéa de l'article L. 2 est complété par une phrase ainsi rédigée :",
    llm: "Pour chaque désignation d'alinéa ou de phrase par un numéro d'ordre (« le cinquième alinéa », « la troisième phrase »…), déterminer, à partir du texte cité ou du contexte, s'il s'agit en réalité du dernier alinéa/phrase de la structure (→ préférer « le dernier alinéa »/« la dernière phrase »), de l'avant-dernier (→ « l'avant-dernier alinéa », et non son numéro, si la structure compte plus de quatre alinéas), ou du second alinéa d'une structure qui n'en comporte que deux (→ « le second alinéa », pas « le deuxième »). Signaler l'emploi d'un numéro d'ordre là où l'une de ces formulations serait plus appropriée, en citant le passage exact.",
  },
  {
    id: "RL-05",
    famille: "Modifications de la norme",
    ref: "§8.2",
    severite: "a_revoir",
    titre: "Formule de remplacement/insertion/complément appropriée à l'opération",
    explication:
      "Chaque type d'opération appelle une formule dédiée : remplacement intégral d'un élément existant → « est ainsi rédigé » ; remplacement d'un élément par plusieurs autres ou par un élément différent → « est remplacé par » ; ajout au tout début d'une structure → « il est ajouté »/« au début » ; création d'un élément nouveau au milieu d'un texte → « il est inséré » ; complément ou ajout à la fin d'une structure → « est complété par » (et non une formule d'insertion, réservée au milieu du texte).",
    exempleKo:
      "Après l'article L. 524-7, il est inséré un article L. 524-8 ainsi rédigé : (alors que l'article prend place à la fin du chapitre)",
    exempleOk: "Le chapitre IV du titre II du livre V est complété par un article L. 524-8 ainsi rédigé :",
    llm: "Pour chaque opération de modification (remplacement, insertion, complément, ajout), déterminer où se situe le point d'insertion par rapport à la structure existante (début, milieu, fin) et le type de remplacement (intégral, par un élément différent ou plusieurs éléments) puis vérifier que la formule employée correspond : « est ainsi rédigé » pour un remplacement intégral ou le remplacement du début/de la fin d'un article, alinéa ou phrase ; « est remplacé par » quand un élément est remplacé par plusieurs autres ou un élément différent ; « il est ajouté »/« au début » pour un ajout tout au début d'une structure ; « il est inséré » pour un nouvel élément au milieu du texte ; « est complété par » pour un complément ou un ajout à la fin d'une structure (notamment un nouvel article placé en fin de division, qui ne doit pas être présenté comme une insertion après l'article précédent). Signaler toute formule inadaptée à la position réelle de la modification, en citant le passage exact.",
  },
  {
    id: "RL-06",
    famille: "Cohérence du dispositif",
    ref: "§PPL-MAT-NOR-002",
    severite: "a_revoir",
    titre: "Disposition dépourvue de portée normative (« neutron législatif »)",
    explication:
      "Un énoncé qui ne prescrit, n'interdit, ne permet, n'habilite et ne sanctionne rien — simple déclaration, souhait ou description — est dépourvu de portée normative et n'a pas sa place dans le dispositif d'une loi.",
    exempleKo:
      "La Nation reconnaît l'importance du secteur agricole pour la cohésion des territoires.",
    exempleOk:
      "Les exploitants agricoles mentionnés à l'article L. 311-1 du code rural bénéficient d'une aide à l'installation dans des conditions fixées par décret.",
    llm: "Repérer les dispositions du dispositif (hors exposé des motifs) qui ne produisent aucun effet de droit identifiable : déclarations de principe (« la Nation reconnaît… », « l'État réaffirme… »), expressions d'un souhait ou d'une intention, descriptions présentées comme des prescriptions. Ne PAS signaler les définitions, les habilitations, ni les dispositions programmatiques d'une loi de programmation. Citer la phrase exacte.",
  },
  {
    id: "RL-07",
    famille: "Cohérence du dispositif",
    ref: "§PPL-MAT-NOR-001",
    severite: "a_revoir",
    titre: "Discordance entre formulation facultative et formulation impérative",
    explication:
      "Une même prescription ne peut être énoncée tantôt comme une faculté (« peut déclarer »), tantôt comme une obligation (« manquement à l'obligation de déclaration ») : la modalité normative applicable devient indéterminable.",
    exempleKo:
      "Art. 2 : L'exploitant peut déclarer tout incident à l'autorité administrative. — Art. 6 : Le manquement à l'obligation de déclaration prévue à l'article 2 est puni d'une amende.",
    exempleOk:
      "Art. 2 : L'exploitant déclare tout incident à l'autorité administrative. — Art. 6 : Le manquement à l'obligation de déclaration prévue à l'article 2 est puni d'une amende.",
    llm: "Comparer, à travers tout le texte, la modalité normative des prescriptions portant sur un même comportement : repérer les cas où une disposition l'énonce comme une faculté (« peut », « a la faculté de ») tandis qu'une autre la traite comme une obligation (sanction d'un « manquement », renvoi à « l'obligation de… »), ou inversement. Repérer aussi les formulations à la force normative indéterminable (« est invité à », « veille à » sans contenu). Citer les deux passages contradictoires (la citation reproduira le passage le plus caractéristique).",
  },
  {
    id: "RL-08",
    famille: "Cohérence du dispositif",
    ref: "§PPL-MAT-QNT-002",
    severite: "a_revoir",
    titre: "Tranches qui se chevauchent ou valeur frontière orpheline",
    explication:
      "Dans un barème ou un zonage, chaque valeur doit relever d'une et une seule tranche. Deux pièges symétriques : la valeur frontière couverte par deux tranches (« de 0 à 100 000 € » puis « de 100 000 à 500 000 € ») et la valeur frontière exclue de toutes (« inférieur à 30 000 € » puis « supérieur à 30 000 € » : 30 000 € ne relève d'aucun taux).",
    exempleKo:
      "Le taux est fixé à 2 % pour les revenus inférieurs à 30 000 € et à 4 % pour les revenus supérieurs à 30 000 €.",
    exempleOk:
      "Le taux est fixé à 2 % pour les revenus inférieurs ou égaux à 30 000 € et à 4 % pour les revenus supérieurs à 30 000 €.",
    llm: "Pour chaque barème, zonage ou jeu de seuils chiffrés, vérifier la partition : (1) chevauchement — une même valeur relève de deux tranches (« de X à Y » puis « de Y à Z ») ; (2) valeur frontière orpheline — la valeur exacte du seuil n'est couverte par aucune tranche (« inférieur à X » + « supérieur à X » sans « ou égal »). Citer le passage exact et proposer la correction (« inférieur ou égal à », « strictement supérieur à »…).",
  },
  {
    id: "RL-09",
    famille: "Cohérence du dispositif",
    ref: "§PPL-MAT-QNT-001",
    severite: "a_revoir",
    titre: "Discordance de seuils entre dispositions",
    explication:
      "Un même seuil (d'assujettissement, d'exonération, de déclenchement) doit recevoir la même valeur et la même borne dans tout le texte : « au moins cinquante salariés » à l'article 2 et « plus de cinquante salariés » à l'article 7 excluent la valeur cinquante du contrôle.",
    exempleKo:
      "Art. 2 : l'obligation s'applique aux entreprises d'au moins cinquante salariés. — Art. 7 : le contrôle porte sur les entreprises de plus de cinquante salariés.",
    exempleOk:
      "Art. 2 : l'obligation s'applique aux entreprises d'au moins cinquante salariés. — Art. 7 : le contrôle porte sur les entreprises d'au moins cinquante salariés.",
    llm: "Relever tous les seuils chiffrés du texte (effectifs, montants, durées, superficies…) et comparer les dispositions censées viser le même seuil : signaler toute discordance de valeur (« cinquante » vs « soixante ») ou de borne (« au moins » vs « plus de », « inférieur à » vs « inférieur ou égal à ») entre l'obligation, son contrôle et sa sanction. Citer le passage divergent.",
  },
  {
    id: "RL-10",
    famille: "Recevabilité et procédure",
    ref: "§PPL-PAR-REC-002",
    severite: "a_revoir",
    titre: "Recevabilité financière (article 40) : gage manquant ou impropre",
    explication:
      "Une proposition de loi qui diminue une ressource publique doit être gagée (compensation de recettes). Une charge publique nouvelle ou aggravée, elle, ne peut être rendue recevable par un simple gage de recettes : la compensation ne vaut que pour les pertes de ressources (article 40 de la Constitution).",
    exempleKo:
      "Il est institué une allocation d'autonomie versée à toute personne de plus de soixante ans. La charge résultant de la présente loi est compensée par la création d'une taxe additionnelle à l'accise sur les tabacs.",
    exempleOk:
      "La perte de recettes résultant pour l'État de la présente loi est compensée, à due concurrence, par la création d'une taxe additionnelle à l'accise sur les tabacs prévue au chapitre IV du titre Ier du livre III du code des impositions sur les biens et services.",
    llm: "Examiner l'incidence financière du dispositif au regard de l'article 40 de la Constitution : (1) si le texte diminue une ressource publique (exonération, réduction d'impôt ou de taxe) sans qu'aucun article de gage (« la perte de recettes… est compensée, à due concurrence, par… ») ne figure dans le texte, le signaler ; (2) si le texte crée ou aggrave une charge publique (nouvelle prestation, extension de bénéficiaires, mission nouvelle confiée à une personne publique) en la « gageant » par une recette (taxe additionnelle sur les tabacs…), signaler que la compensation est impropre : un gage de recettes ne couvre pas une charge. Citer le passage le plus caractéristique.",
  },
];
