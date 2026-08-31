import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AGE_BAND } from "@/game/model";
import "@/i18n";
import { PackingScreen } from "@/screens/PackingScreen";

afterEach(cleanup);

describe("PackingScreen", () => {
  it("asks younger protagonists about their sport", () => {
    render(<PackingScreen ageBand={AGE_BAND.CHILDHOOD} onSubmit={vi.fn()} />);

    expect(screen.getByText("Deporte")).toBeVisible();
    expect(screen.queryByText("Profesión")).not.toBeInTheDocument();
  });

  it("asks older protagonists about their profession", () => {
    render(<PackingScreen ageBand={AGE_BAND.ADULTHOOD} onSubmit={vi.fn()} />);

    expect(screen.getByText("Profesión")).toBeVisible();
    expect(screen.queryByText("Deporte")).not.toBeInTheDocument();
  });
});
