import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UNLOCKABLE_ID } from "@/game/unlockables";
import "@/i18n";
import { UnlockablesScreen } from "@/screens/UnlockablesScreen";

afterEach(cleanup);

describe("unlockables screen", () => {
  it("shows every condition and distinguishes unlocked cards without hiding content", async () => {
    const onBack = vi.fn();
    render(
      <UnlockablesScreen
        progress={{
          schemaVersion: 1,
          entries: [{ id: UNLOCKABLE_ID.FAMILY_TOGETHER, unlockedAt: 1_000 }],
        }}
        onBack={onBack}
      />,
    );

    expect(screen.getAllByRole("article")).toHaveLength(10);
    expect(screen.getByRole("heading", { name: "Llegaron juntos" })).toBeVisible();
    expect(
      screen.getByText("Llegá al campamento sin dejar atrás a ningún familiar."),
    ).toBeVisible();
    expect(screen.getAllByText("Desbloqueado")).toHaveLength(1);
    expect(screen.getAllByText("Bloqueado")).toHaveLength(9);

    await userEvent.click(screen.getByRole("button", { name: "Volver a partidas" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
