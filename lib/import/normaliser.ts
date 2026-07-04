export function normaliser(texte: string): string {
  return texte
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ")
    .replace(/\t/g, " ")
    .split("\n")
    .map((l) => l.replace(/ +$/g, "").replace(/ {2,}/g, " "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
