const DEFI =
  "https://hackathon2026.assemblee-nationale.fr/defis/cee00932-3b4b-4c44-a338-047a9bdd2d14";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>NormaCheck — vérificateur de légistique.</p>
        <p>
          Projet issu du{" "}
          <a
            href={DEFI}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            Hackathon 2026 de l&apos;Assemblée nationale
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
