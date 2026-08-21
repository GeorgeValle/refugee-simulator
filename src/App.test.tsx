import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import "@/i18n";

vi.mock("@/game/PhaserStage", () => ({ PhaserStage: () => null }));

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
