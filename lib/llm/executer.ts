import { execFile } from "node:child_process";
import os from "node:os";

/**
 * Exécute la CLI `claude` locale en mode headless (couverte par le plan Claude).
 * Bascule API ultérieure : réécrire uniquement cette fonction.
 */
export function executerLlm(prompt: string): Promise<string> {
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
        timeout: 120_000,
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
