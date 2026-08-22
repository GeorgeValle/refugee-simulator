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
  await expect(page.locator(".app")).toHaveAttribute("data-reduced-motion", "true");
  await page.getByRole("button", { name: "Juego nuevo" }).first().click();
  await page.getByRole("button", { name: "Hombre" }).click();
  await page.getByRole("button", { name: "Juventud" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator(".dialogue__text")).toContainText("Vivís en Nahr");
  await expect(page.getByRole("button", { name: "Mostrar todo el texto" })).toHaveCount(0);
});

test("mueve el foco solo al cambiar de capítulo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Entiendo y quiero continuar" }).click();
  await expect(
    page.getByRole("heading", { name: "Simulador de Refugiado", level: 1 }),
  ).toBeFocused();

  await page.getByRole("button", { name: "Juego nuevo" }).first().click();
  await expect(page.getByRole("heading", { name: "Creá tu personaje" })).toBeFocused();
  await page.getByRole("button", { name: "Hombre" }).click();
  await page.getByRole("button", { name: "Juventud" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("region", { name: "Diálogo de la historia" })).toBeFocused();

  await page.getByRole("button", { name: "Abrir ajustes" }).click();
  const music = page.getByRole("slider", { name: "Música" });
  await music.focus();
  await music.press("ArrowRight");
  await expect(music).toBeFocused();
});

test("el ajuste manual reduce también la animación del aviso de orientación", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone-landscape", "Solo corresponde al proyecto móvil");
  await page.goto("/");
  await page.getByRole("button", { name: "Entiendo y quiero continuar" }).click();
  await page.getByRole("button", { name: "Abrir ajustes" }).click();
  await page.getByRole("checkbox", { name: "Reducir movimiento y destellos" }).check();
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.locator(".app")).toHaveAttribute("data-reduced-motion", "true");

  await page.setViewportSize({ width: 390, height: 844 });
  const guard = page.getByRole("alertdialog", { name: "Giralo para continuar" });
  await expect(guard).toBeVisible();
  const animationDuration = await page
    .locator(".orientation-guard__phone")
    .evaluate((element) => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(animationDuration)).toBeLessThanOrEqual(0.001);

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(({ impact }) => impact === "critical" || impact === "serious"),
  ).toEqual([]);
});
