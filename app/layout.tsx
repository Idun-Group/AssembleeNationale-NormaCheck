import type { Metadata } from "next";
import { Lora, Lato } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });
const lato = Lato({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "NormaCheck — Analyse légistique",
  description: "Vérifiez un texte législatif contre le guide de légistique de l'Assemblée nationale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${lora.variable} ${lato.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
              <SiteFooter />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
