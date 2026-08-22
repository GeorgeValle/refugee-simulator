import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { PERSISTENCE_RESULT, preferencesRepository } from "@/game/storage";
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
