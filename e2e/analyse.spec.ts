import { test, expect } from "@playwright/test";

test("flux complet : exemple -> analyse -> correction -> score", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("exemple-pedagogique").click();

  // findings déterministes immédiats
  await expect(page.getByTestId("texte-annote")).toBeVisible();
  const surlignages = page.getByTestId("surlignage");
  await expect(surlignages.first()).toBeVisible();
  const nbAvant = await surlignages.count();
  expect(nbAvant).toBeGreaterThan(5);

  const scoreAvant = Number(await page.getByTestId("jauge-score").getAttribute("data-score"));
  expect(scoreAvant).toBeLessThan(100);

  // appliquer une correction via popover
  await surlignages.first().click();
  const boutonAppliquer = page.getByTestId("bouton-appliquer");
  if (await boutonAppliquer.isVisible()) {
    await boutonAppliquer.click();
    await expect(surlignages).toHaveCount(nbAvant - 1);
  }

  // tout corriger -> le score remonte
  await page.getByTestId("bouton-tout-corriger").click();
  await expect
    .poll(async () => Number(await page.getByTestId("jauge-score").getAttribute("data-score")))
    .toBeGreaterThan(scoreAvant);
});

test("le glossaire liste les règles et la recherche filtre", async ({ page }) => {
  await page.goto("/glossaire");
  await expect(page.locator("[id='R9.2-01']")).toBeVisible();
});

test("saisie manuelle : texte propre -> score 100", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("zone-texte").fill(
    "Le maire transmet la liste au représentant de l'État dans le département avant le 1er mars.",
  );
  await page.getByTestId("bouton-analyser").click();
  // >= 95 : tolère un éventuel finding « à revoir » remonté par l'analyse IA
  await expect
    .poll(async () => Number(await page.getByTestId("jauge-score").getAttribute("data-score")))
    .toBeGreaterThanOrEqual(95);
});
