import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

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
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:text-primary">Analyse</Link>
          <Link href="/glossaire" className="text-sm font-medium hover:text-primary">Glossaire</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
