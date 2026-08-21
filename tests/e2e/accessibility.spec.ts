import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("el menú y el aviso de contenido no tienen infracciones graves", async ({ page }) => {
  await page.goto("/");
  const warningResults = await new AxeBuilder({ page }).analyze();
  expect(
    warningResults.violations.filter(({ impact }) => impact === "critical" || impact === "serious"),
  ).toEqual([]);

  await page.getByRole("button", { name: "Entiendo y quiero continuar" }).click();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  const menuResults = await new AxeBuilder({ page }).analyze();
  expect(
    menuResults.violations.filter(({ impact }) => impact === "critical" || impact === "serious"),
  ).toEqual([]);
});

test("respeta la preferencia del sistema de reducir movimiento", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Entiendo y quiero continuar" }).click();
  await page.getByRole("button", { name: "Juego nuevo" }).first().click();
  await page.getByRole("button", { name: "Hombre" }).click();
  await page.getByRole("button", { name: "Juventud" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator(".dialogue__text")).toContainText("Vivís en Nahr");
  await expect(page.getByRole("button", { name: "Mostrar todo el texto" })).toHaveCount(0);
});
