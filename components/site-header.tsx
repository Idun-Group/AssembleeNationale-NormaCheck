import Image from "next/image";
import Link from "next/link";
import { GithubIcon } from "@/components/github-icon";
import { ThemeToggle } from "@/components/theme-toggle";

const HACKATHON =
  "https://hackathon2026.assemblee-nationale.fr/defis/cee00932-3b4b-4c44-a338-047a9bdd2d14";
const REPO = "https://github.com/Idun-Group/AssembleeNationale-NormaCheck";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95 sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-normacheck.jpg"
            alt="NormaCheck"
            width={40}
            height={40}
            className="rounded"
            priority
          />
          <div>
            <span className="font-serif text-xl font-semibold text-primary">NormaCheck</span>
            <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">Analyse légistique</span>
          </div>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="text-sm font-medium hover:text-primary">Analyse</Link>
          <Link href="/glossaire" className="text-sm font-medium hover:text-primary">Glossaire</Link>
          <a
            href={HACKATHON}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 md:inline"
          >
            Hackathon 2026
          </a>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Code source sur GitHub"
            title="Code source sur GitHub"
            className="text-muted-foreground hover:text-primary"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
