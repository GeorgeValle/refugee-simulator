import { expect, type Page, test } from "@playwright/test";

async function acceptWarning(page: Page) {
  await page.getByRole("button", { name: "Entiendo y quiero continuar" }).click();
}

async function reachTimedLoss(page: Page) {
  await page.getByRole("button", { name: "Juego nuevo" }).first().click();
  await page.getByRole("button", { name: "Hombre" }).click();
  await page.getByRole("button", { name: "Juventud" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  const relationships = page.getByRole("combobox");
  await relationships.nth(0).selectOption("wife");
  await relationships.nth(1).selectOption("daughter");
  await relationships.nth(2).selectOption("brother");
  await relationships.nth(3).selectOption("mother");
  const names = page.getByPlaceholder("Escribí su nombre");
  for (const [index, name] of ["Lina", "Mariam", "Omar", "Samira"].entries()) {
    await names.nth(index).fill(name);
  }
  await page.getByRole("button", { name: "Continuar" }).click();

  for (const [index, object] of [
    "una foto",
    "las llaves",
    "una botella",
    "un cuaderno",
  ].entries()) {
    await page.getByLabel(`Objeto ${index + 1}`).fill(object);
  }
  await page.getByLabel("Profesión").fill("docente");
  await page.getByLabel("Habilidad").fill("reparar bicicletas");
  await page.getByLabel("Ropa favorita").fill("mi abrigo azul");
  await page.getByLabel("Sueño que anhelás alcanzar").fill("abrir una escuela");
  await page.getByRole("button", { name: "Continuar" }).click();

  const firstLossChoices = page.locator(".paper-slip--button");
  await firstLossChoices.nth(0).click();
  await firstLossChoices.nth(1).click();
  await page.getByRole("button", { name: "Dejarlos atrás" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Elegí dos papelitos" })).toBeVisible();
}

test("mantiene la interfaz si falla el escenario Phaser", async ({ page }) => {
  await page.route("**/assets/PhaserStage-*.js", (route) => route.abort());
  await page.goto("/");
  await acceptWarning(page);

  await expect(page.getByRole("button", { name: "Juego nuevo" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Juego nuevo" }).first().click();
  await expect(page.getByRole("heading", { name: "Creá tu personaje" })).toBeVisible();
  await expect(page.locator(".game-stage__canvas--fallback")).toBeAttached();
});

test("continúa en memoria y avisa cuando localStorage rechaza escrituras", async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      if (key === "refugee-simulator:saves:v1" || key === "refugee-simulator:preferences:v1") {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }
      originalSetItem.call(this, key, value);
    };
  });
  await page.goto("/");
  await acceptWarning(page);
  await expect(page.getByRole("status")).toContainText("No pudimos guardar");

  await page.getByRole("button", { name: "Juego nuevo" }).first().click();
  await expect(page.getByRole("heading", { name: "Creá tu personaje" })).toBeVisible();
  await page.getByRole("button", { name: "Simulador de Refugiado" }).click();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Creá tu personaje" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("status")).toContainText("No pudimos guardar");
  await expect(page.getByRole("button", { name: "Continuar" })).toHaveCount(0);
  await expect(page.getByText("Ranura vacía")).toHaveCount(3);
});

test("completa la historia y conserva las decisiones", async ({ page }) => {
  await page.goto("/");
  await acceptWarning(page);
  await expect(page.locator("canvas")).toBeVisible();
  await reachTimedLoss(page);

  const timedChoices = page.locator(".paper-slip--button");
  await timedChoices.nth(0).click();
  await timedChoices.nth(1).click();
  await page.getByRole("button", { name: "Dejarlos atrás" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Correr por tu vida" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "Lo que quedó atrás" }).first()).toBeVisible();
  await expect(page.getByText("117,8 millones")).toBeVisible();
  await expect(page.getByText(/No sabés qué ocurrió después/).first()).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Continuar partida" }).click();
  await expect(page.getByRole("heading", { name: "Lo que quedó atrás" }).first()).toBeVisible();
  await expect(page.locator(".loss-summary li")).toHaveCount(6);
});

test("pausa el contador al pasar un teléfono a vertical", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "phone-landscape", "Solo corresponde al proyecto móvil");
  await page.goto("/");
  await acceptWarning(page);
  await reachTimedLoss(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Giralo para continuar" })).toBeVisible();
  await page.waitForTimeout(300);

  const paused = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("refugee-simulator:saves:v1") ?? "[]");
    return sessions[0];
  });
  expect(paused.timerDeadline).toBeNull();
  expect(paused.timerRemainingMs).toBeGreaterThan(0);
  const remaining = paused.timerRemainingMs;

  await page.waitForTimeout(1_200);
  const stillPaused = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("refugee-simulator:saves:v1") ?? "[]");
    return sessions[0];
  });
  expect(stillPaused.timerRemainingMs).toBe(remaining);
  expect(stillPaused.losses).toHaveLength(2);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole("heading", { name: "Giralo para continuar" })).toBeHidden();
  await page.waitForTimeout(300);
  const resumed = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("refugee-simulator:saves:v1") ?? "[]");
    return sessions[0];
  });
  expect(resumed.timerRemainingMs).toBeNull();
  expect(resumed.timerDeadline).toBeGreaterThan(Date.now());
  expect(resumed.losses).toHaveLength(2);
});

test("pausa el contador mientras Ajustes está abierto", async ({ page }) => {
  await page.goto("/");
  await acceptWarning(page);
  await reachTimedLoss(page);

  await page.getByRole("button", { name: "Abrir ajustes" }).click();
  await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible();
  await page.waitForTimeout(300);

  const paused = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("refugee-simulator:saves:v1") ?? "[]");
    return sessions[0];
  });
  expect(paused.timerDeadline).toBeNull();
  expect(paused.timerRemainingMs).toBeGreaterThan(0);
  const remaining = paused.timerRemainingMs;

  await page.waitForTimeout(1_200);
  const stillPaused = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("refugee-simulator:saves:v1") ?? "[]");
    return sessions[0];
  });
  expect(stillPaused.timerRemainingMs).toBe(remaining);
  expect(stillPaused.losses).toHaveLength(2);

  await page.getByRole("button", { name: "Cerrar" }).click();
  await page.waitForTimeout(300);
  const resumed = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("refugee-simulator:saves:v1") ?? "[]");
    return sessions[0];
  });
  expect(resumed.timerRemainingMs).toBeNull();
  expect(resumed.timerDeadline).toBeGreaterThan(Date.now());
  expect(resumed.losses).toHaveLength(2);
});

test("reanuda una sola vez después de cerrar Ajustes y volver a horizontal", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone-landscape", "Solo corresponde al proyecto móvil");
  await page.goto("/");
  await acceptWarning(page);
  await reachTimedLoss(page);

  await page.getByRole("button", { name: "Abrir ajustes" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Giralo para continuar" })).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole("heading", { name: "Giralo para continuar" })).toBeHidden();
  await page.waitForTimeout(300);

  const stillPaused = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("refugee-simulator:saves:v1") ?? "[]");
    return sessions[0];
  });
  expect(stillPaused.timerDeadline).toBeNull();
  expect(stillPaused.timerRemainingMs).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Cerrar" }).click();
  await page.waitForTimeout(300);
  const resumed = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem("refugee-simulator:saves:v1") ?? "[]");
    return sessions[0];
  });
  expect(resumed.timerRemainingMs).toBeNull();
  expect(resumed.timerDeadline).toBeGreaterThan(Date.now());
  expect(resumed.losses).toHaveLength(2);
});
