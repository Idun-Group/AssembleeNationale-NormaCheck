"use client";

import { useMemo, useState } from "react";
import { REGLES, FAMILLES } from "@/lib/rules";
import type { Regle } from "@/lib/rules/types";
import { CarteRegle } from "@/components/carte-regle";
import { Input } from "@/components/ui/input";

function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function correspond(regle: Regle, requete: string): boolean {
  if (!requete) return true;
  const cible = normaliser(`${regle.titre} ${regle.explication} ${regle.id}`);
  return cible.includes(requete);
}

export function GlossaireClient() {
  const [recherche, setRecherche] = useState("");

  const requeteNormalisee = useMemo(() => normaliser(recherche.trim()), [recherche]);

  const reglesFiltrees = useMemo(
    () => REGLES.filter((regle) => correspond(regle, requeteNormalisee)),
    [requeteNormalisee]
  );

  const groupes = useMemo(() => {
    return FAMILLES.map((famille) => ({
      famille,
      regles: reglesFiltrees.filter((regle) => regle.famille === famille),
    })).filter((groupe) => groupe.regles.length > 0);
  }, [reglesFiltrees]);

  return (
    <div className="space-y-8">
      <Input
        type="search"
        placeholder="Rechercher une règle (titre, id, mot-clé)…"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        className="h-10 max-w-md"
        aria-label="Rechercher une règle"
      />

      <p className="text-sm text-muted-foreground">
        {reglesFiltrees.length} règle{reglesFiltrees.length > 1 ? "s" : ""}
        {recherche.trim() ? " trouvée" + (reglesFiltrees.length > 1 ? "s" : "") : " au total"}
      </p>

      {groupes.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune règle ne correspond à cette recherche.</p>
      )}

      {groupes.map(({ famille, regles }) => (
        <section key={famille} className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">{famille}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {regles.map((regle) => (
              <CarteRegle key={regle.id} regle={regle} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
