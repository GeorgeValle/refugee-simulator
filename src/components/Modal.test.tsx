import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/Modal";
import { OrientationGuard } from "@/components/OrientationGuard";
import "@/i18n";

describe("blocking overlay focus", () => {
  it("cycles focus inside a modal", async () => {
    const user = userEvent.setup();
    render(
      <Modal open title="Prueba">
        <button type="button">Primero</button>
        <button type="button">Último</button>
      </Modal>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Último" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
  });

  it("preserves control focus when the close callback changes", async () => {
    const user = userEvent.setup();
    const latestClose = vi.fn();
    const { rerender } = render(
      <Modal open title="Ajustes" onClose={() => undefined}>
        <input aria-label="Volumen" type="range" />
      </Modal>,
    );
    const volume = screen.getByRole("slider", { name: "Volumen" });
    volume.focus();

    rerender(
      <Modal open title="Ajustes" onClose={latestClose}>
        <input aria-label="Volumen" type="range" />
      </Modal>,
    );

    expect(volume).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(latestClose).toHaveBeenCalledOnce();
  });

  it("keeps focus on the portrait orientation guard", async () => {
    const user = userEvent.setup();
    render(<OrientationGuard />);
    const guard = screen.getByRole("alertdialog");
    expect(guard).toHaveFocus();
    await user.tab();
    expect(guard).toHaveFocus();
  });
});
