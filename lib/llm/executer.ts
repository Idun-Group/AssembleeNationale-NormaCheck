import { execFile } from "node:child_process";
import os from "node:os";
import { reponseLlmMock } from "./mock";

/**
 * Exécute la CLI `claude` locale en mode headless (couverte par le plan Claude).
 * Bascule API ultérieure : réécrire uniquement cette fonction.
 *
 * Mode démo hors-ligne : si NORMACHECK_LLM_MOCK=1, on renvoie une réponse
 * plausible sans appeler la CLI (utile en démo si le réseau ou l'authentification
 * `claude` est indisponible). Désactivé par défaut.
 */
// Timeout d'un appel CLI. Les textes législatifs réels (> 2500 mots) demandent
// 170-240 s à `claude -p --model sonnet` ; 120 s était trop bas. Configurable
// pour la démo / la bascule d'environnement.
const TIMEOUT_MS = Number(process.env.NORMACHECK_LLM_TIMEOUT_MS ?? 300_000);

// Le plan Claude local ne tient pas plusieurs `claude -p` simultanés (chaque
// appel concurrent gonfle la latence et finit par expirer). On sérialise donc
// les appels : une file d'attente de concurrence 1 à l'échelle du process.
let file: Promise<unknown> = Promise.resolve();
function enfiler<T>(job: () => Promise<T>): Promise<T> {
  const resultat = file.then(job, job);
  file = resultat.then(
    () => undefined,
    () => undefined,
  );
  return resultat;
}

function estTimeout(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { killed?: boolean }).killed === true;
}

function unAppel(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "claude",
      [
        "-p",
        "--output-format", "json",
        "--dangerously-skip-permissions",
        "--model", "sonnet",
        "--strict-mcp-config", // n'active aucun serveur MCP : démarrage rapide
      ],
      {
        cwd: os.tmpdir(),      // hors du repo : pas de CLAUDE.md ni de contexte projet
        timeout: TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, CLAUDE_CODE_DISABLE_TELEMETRY: "1" },
      },
      (err, stdout) => {
        if (err) return reject(err);
        try {
          // --output-format json enveloppe la réponse : { type: "result", result: "<texte>", ... }
          const enveloppe = JSON.parse(stdout) as { result?: string; is_error?: boolean };
          if (enveloppe.is_error || typeof enveloppe.result !== "string") {
            return reject(new Error("réponse CLI en erreur"));
          }
          resolve(enveloppe.result);
        } catch (e) {
          reject(e);
        }
      },
    );
    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

export function executerLlm(prompt: string): Promise<string> {
  if (process.env.NORMACHECK_LLM_MOCK === "1") {
    return Promise.resolve(reponseLlmMock(prompt));
  }
  return enfiler(async () => {
    try {
      return await unAppel(prompt);
    } catch (err) {
      // Une tentative de relance sur échec transitoire (timeout, hoquet CLI).
      if (estTimeout(err)) return await unAppel(prompt);
      throw err;
    }
  });
}
