import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { createSession } from "@/game/model";
import { createSaveRepository, PERSISTENCE_RESULT, preferencesRepository } from "@/game/storage";
import "@/i18n";

vi.mock("@/game/PhaserStage", () => ({ PhaserStage: () => null }));

afterEach(cleanup);

describe("content warning storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows acceptance when session storage is unavailable", async () => {
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    render(<App />);
    const accept = screen.getByRole("button", { name: "Entiendo y quiero continuar" });
    await userEvent.click(accept);

    expect(accept).not.toBeInTheDocument();
  });
});

describe("volatile storage warning", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("warns without blocking play and disappears after persistence recovers", async () => {
    sessionStorage.setItem("refugee-simulator:warning-accepted", "true");
    vi.spyOn(preferencesRepository, "save")
      .mockReturnValueOnce(PERSISTENCE_RESULT.MEMORY)
      .mockReturnValue(PERSISTENCE_RESULT.PERSISTENT);

    render(<App />);
    const warning = await screen.findByText(/No pudimos guardar/i);
    expect(warning).toHaveAttribute("role", "status");

    await userEvent.click(screen.getByRole("button", { name: "Abrir ajustes" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Silenciar todo" }));
    await waitFor(() => expect(screen.queryByText(/No pudimos guardar/i)).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Ajustes" })).toBeVisible();
  });
});

describe("story focus navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("focuses each new chapter without stealing focus during preference changes", async () => {
    sessionStorage.setItem("refugee-simulator:warning-accepted", "true");
    const user = userEvent.setup();
    render(<App />);

    const menuTitle = screen.getByRole("heading", { name: "Simulador de Refugiado", level: 1 });
    await waitFor(() => expect(menuTitle).toHaveFocus());

    const [newGame] = screen.getAllByRole("button", { name: "Juego nuevo" });
    if (!newGame) throw new Error("Expected an empty save slot");
    await user.click(newGame);
    const profileTitle = screen.getByRole("heading", { name: "Creá tu personaje" });
    await waitFor(() => expect(profileTitle).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Hombre" }));
    await user.click(screen.getByRole("button", { name: /Juventud/ }));
    await user.click(screen.getByRole("button", { name: /^Continuar/ }));
    const dialogue = screen.getByRole("region", { name: "Diálogo de la historia" });
    await waitFor(() => expect(dialogue).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Abrir ajustes" }));
    const music = screen.getByRole("slider", { name: "Música" });
    await user.click(music);
    await user.keyboard("{ArrowRight}");
    expect(music).toHaveFocus();
  });
});

describe("stale save slot protection", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.setItem("refugee-simulator:warning-accepted", "true");
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("rechecks an apparently empty slot before replacing another tab's save", async () => {
    const user = userEvent.setup();
    render(<App />);
    const [newGame] = screen.getAllByRole("button", { name: "Juego nuevo" });
    if (!newGame) throw new Error("Expected an empty save slot");
    const otherTab = createSaveRepository();
    const externalSession = createSession(1, 1_000);
    expect(otherTab.save(externalSession)).toBe(PERSISTENCE_RESULT.PERSISTENT);

    await user.click(newGame);

    expect(screen.getByRole("dialog", { name: "¿Reemplazar esta partida?" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Creá tu personaje" })).not.toBeInTheDocument();
    expect(otherTab.load(1)?.id).toBe(externalSession.id);
  });
});
