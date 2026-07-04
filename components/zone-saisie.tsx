"use client";
import { useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/github-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EXEMPLES } from "@/data/exemples";

const HACKATHON =
  "https://hackathon2026.assemblee-nationale.fr/defis/cee00932-3b4b-4c44-a338-047a9bdd2d14";
const REPO = "https://github.com/Idun-Group/AssembleeNationale-NormaCheck";

export function ZoneSaisie({ onAnalyser }: { onAnalyser: (texte: string) => void }) {
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function importer(file: File) {
    setChargement(true);
    setErreur(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erreur);
      setTexte(data.texte);
    } catch {
      setErreur("Impossible d'extraire le texte de ce fichier (.docx, .pdf et .txt acceptés).");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2 pt-6 text-center">
        <h1 className="font-serif text-4xl font-semibold text-primary">
          Vérifiez la légistique de votre texte
        </h1>
        <p className="text-muted-foreground">
          Collez un texte législatif ou importez un fichier : NormaCheck détecte les règles du
          guide de légistique enfreintes et propose des corrections.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <a
            href={HACKATHON}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            🏛️ Hackathon 2026 de l&apos;Assemblée nationale
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            <GithubIcon className="h-4 w-4" />
            Open source · GitHub
          </a>
        </div>
      </div>
      <Textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Collez ici un article de loi, un amendement, une proposition de loi…"
        className="min-h-64 font-serif text-base"
        data-testid="zone-texte"
      />
      {erreur && <p className="text-sm text-destructive">{erreur}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" disabled={texte.trim().length < 20 || chargement}
          onClick={() => onAnalyser(texte)} data-testid="bouton-analyser">
          Analyser le texte
        </Button>
        <Button variant="outline" size="lg" disabled={chargement}
          onClick={() => inputRef.current?.click()}>
          {chargement ? "Extraction…" : "Importer un fichier"}
        </Button>
        <input ref={inputRef} type="file" accept=".docx,.pdf,.txt" className="hidden"
          onChange={(e) => e.target.files?.[0] && importer(e.target.files[0])}
          onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} />
      </div>
      <div className="grid gap-4 pt-4 sm:grid-cols-3">
        {EXEMPLES.map((ex) => (
          <Card key={ex.id} className="cursor-pointer transition hover:border-primary"
            onClick={() => onAnalyser(ex.texte)} data-testid={`exemple-${ex.id}`}>
            <CardHeader>
              <CardTitle className="font-serif text-base">{ex.titre}</CardTitle>
              <CardDescription>{ex.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs font-medium text-primary">Essayer cet exemple →</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
