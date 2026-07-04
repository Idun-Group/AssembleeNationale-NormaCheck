"use client";
import { useMemo, useRef, useState } from "react";
import type { Finding } from "@/lib/rules/types";
import { analyser } from "@/lib/engine/analyser";
import { fusionner, ancrer } from "@/lib/engine/fusion";
import { ZoneSaisie } from "@/components/zone-saisie";
import { VueResultat } from "@/components/vue-resultat";

export type StatutLlm = "inactif" | "en_cours" | "ok" | "indisponible";

export function Analyseur() {
  const [texte, setTexte] = useState("");
  const [enResultat, setEnResultat] = useState(false);
  const [findingsLlm, setFindingsLlm] = useState<Finding[]>([]);
  const [statutLlm, setStatutLlm] = useState<StatutLlm>("inactif");
  // Ticket de requête : une réponse /api/analyze-llm plus lente qu'une analyse
  // plus récente ne doit pas écraser l'état courant (course entre requêtes).
  const ticketRef = useRef(0);

  // Le déterministe se recalcule à chaque frappe/correction ; les findings LLM
  // sont ré-ancrés par leur extrait (citation) sur le texte courant.
  const findings = useMemo(() => {
    if (!enResultat) return [];
    const det = analyser(texte);
    const llm = findingsLlm.map((f) => ({ ...f, span: ancrer(f.extrait, texte) }));
    return fusionner(det, llm);
  }, [texte, findingsLlm, enResultat]);

  async function lancerAnalyse(t: string) {
    const ticket = ++ticketRef.current;
    setTexte(t);
    setEnResultat(true);
    setStatutLlm("en_cours");
    try {
      const res = await fetch("/api/analyze-llm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texte: t }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { findings: Finding[] };
      if (ticket !== ticketRef.current) return; // réponse obsolète : une analyse plus récente a démarré
      setFindingsLlm(data.findings);
      setStatutLlm("ok");
    } catch {
      if (ticket !== ticketRef.current) return;
      setFindingsLlm([]);
      setStatutLlm("indisponible");
    }
  }

  function nouvelleAnalyse() {
    ticketRef.current++;
    setEnResultat(false);
    setFindingsLlm([]);
    setStatutLlm("inactif");
    setTexte("");
  }

  // Écarter un finding LLM appliqué/corrigé : son extrait d'origine disparaît du texte,
  // le ré-ancrage le passe à span null -> on le retire s'il avait une suggestion appliquée.
  function appliquer(nouveauTexte: string, findingApplique: Finding) {
    setTexte(nouveauTexte);
    if (findingApplique.source === "llm") {
      setFindingsLlm((prev) => prev.filter((f) => f.id !== findingApplique.id));
    }
  }

  return enResultat ? (
    <VueResultat
      texte={texte}
      findings={findings}
      statutLlm={statutLlm}
      onAppliquer={appliquer}
      onTexteChange={setTexte}
      onRetirerLlm={(ids) => setFindingsLlm((p) => p.filter((f) => !ids.includes(f.id)))}
      onNouvelleAnalyse={nouvelleAnalyse}
    />
  ) : (
    <ZoneSaisie onAnalyser={lancerAnalyse} />
  );
}
