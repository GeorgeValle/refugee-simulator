import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameStageBoundary } from "@/components/GameStageBoundary";

function BrokenStage(): never {
  throw new Error("Phaser chunk unavailable");
}

describe("GameStageBoundary", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps the surrounding React interface available when the stage fails", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <div>
        <GameStageBoundary>
          <BrokenStage />
        </GameStageBoundary>
        <button type="button">Juego nuevo</button>
      </div>,
    );

    expect(container.querySelector(".game-stage__canvas--fallback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Juego nuevo" })).toBeEnabled();
  });
});
