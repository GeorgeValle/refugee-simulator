import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AGE_BAND, SLIP_KIND, SLIP_STATUS, STORY_STEP } from "@/game/model";
import "@/i18n";
import { EndingScreen } from "@/screens/EndingScreen";
import { createStorySession } from "@/test/storyFixtures";

afterEach(cleanup);

describe("personalized ending", () => {
  it("shows both the family and age reflections when both apply", () => {
    const ending = createStorySession(STORY_STEP.ENDING);
    const session = {
      ...ending,
      profile: ending.profile ? { ...ending.profile, ageBand: AGE_BAND.CHILDHOOD } : null,
      slips: ending.slips.map((slip) =>
        slip.kind === SLIP_KIND.FAMILY ? { ...slip, status: SLIP_STATUS.ACTIVE } : slip,
      ),
    };

    render(<EndingScreen session={session} showCaptions={false} onMenu={() => undefined} />);

    expect(screen.getByText(/Gracias al cielo, llegaron juntos/i)).toBeVisible();
    expect(screen.getByText(/una edad tan corta puede dejar traumas/i)).toBeVisible();
  });

  it("shows the youth-specific Siembra sin cosecha reflection", () => {
    render(
      <EndingScreen
        session={createStorySession(STORY_STEP.ENDING)}
        showCaptions={false}
        onMenu={() => undefined}
      />,
    );

    expect(screen.getByText(/Siembra sin cosecha/i)).toBeVisible();
  });

  it("shows the selected protagonist card below the camp sound caption", () => {
    render(
      <EndingScreen
        session={createStorySession(STORY_STEP.ENDING)}
        showCaptions
        onMenu={() => undefined}
      />,
    );

    expect(screen.getAllByText("Llegaste al campamento")).toHaveLength(2);
    expect(screen.getByAltText(/Retrato simbólico de tu personaje/i)).toHaveAttribute(
      "src",
      expect.stringContaining("protagonist-man-youth.png"),
    );
  });
});

describe("grouped ending summary", () => {
  it("separates family members from other losses and explains when nobody arrived", () => {
    render(
      <EndingScreen
        session={createStorySession(STORY_STEP.ENDING)}
        showCaptions={false}
        onMenu={() => undefined}
      />,
    );

    const losses = screen.getByRole("region", { name: "Lo que quedó atrás" });
    expect(within(losses).getAllByRole("listitem")).toHaveLength(2);

    const separated = screen.getByRole("region", { name: "Quiénes quedaron atrás" });
    const separatedCards = within(separated).getAllByRole("article");
    expect(separatedCards).toHaveLength(4);
    expect(within(separated).getByText("Lina")).toBeVisible();
    expect(within(separated).getByText("esposa")).toBeVisible();
    expect(within(separated).getAllByText("Su destino continúa siendo desconocido.")).toHaveLength(
      4,
    );
    expect(separatedCards[0]).toHaveClass("family-outcome-card--separated");
    expect(separatedCards[0]?.querySelector("img")).toHaveAttribute("alt", "");
    expect(separatedCards[0]?.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("protagonist-woman-youth.png"),
    );

    const remaining = screen.getByRole("region", { name: "Lo que todavía llevás con vos" });
    expect(within(remaining).getAllByRole("article")).toHaveLength(6);
    const arrived = screen.getByRole("region", { name: "¿Con quiénes llegaste?" });
    expect(within(arrived).getByText(/No llegó con vos ninguna de las personas/i)).toBeVisible();
  });

  it("shows a reunited family in color without a separated-family section", () => {
    const ending = createStorySession(STORY_STEP.ENDING);
    const session = {
      ...ending,
      slips: ending.slips.map((slip) =>
        slip.kind === SLIP_KIND.FAMILY ? { ...slip, status: SLIP_STATUS.ACTIVE } : slip,
      ),
    };

    render(<EndingScreen session={session} showCaptions={false} onMenu={() => undefined} />);

    expect(
      screen.queryByRole("heading", { name: "Quiénes quedaron atrás" }),
    ).not.toBeInTheDocument();
    const arrived = screen.getByRole("region", { name: "¿Con quiénes llegaste?" });
    const arrivedCards = within(arrived).getAllByRole("article");
    expect(arrivedCards).toHaveLength(4);
    for (const card of arrivedCards) {
      expect(card).not.toHaveClass("family-outcome-card--separated");
      expect(card.querySelector("img")).toHaveAttribute("alt", "");
    }
  });

  it("places each family member exactly once in a mixed outcome", () => {
    const ending = createStorySession(STORY_STEP.ENDING);
    const firstFamily = ending.slips.find((slip) => slip.kind === SLIP_KIND.FAMILY);
    if (!firstFamily) throw new Error("Expected a family slip");
    const session = {
      ...ending,
      slips: ending.slips.map((slip) =>
        slip.id === firstFamily.id ? { ...slip, status: SLIP_STATUS.ACTIVE } : slip,
      ),
    };

    render(<EndingScreen session={session} showCaptions={false} onMenu={() => undefined} />);

    const separated = screen.getByRole("region", { name: "Quiénes quedaron atrás" });
    const arrived = screen.getByRole("region", { name: "¿Con quiénes llegaste?" });
    expect(within(separated).getAllByRole("article")).toHaveLength(3);
    expect(within(arrived).getAllByRole("article")).toHaveLength(1);
    expect(within(arrived).getByText(firstFamily.value)).toBeVisible();
    expect(within(separated).queryByText(firstFamily.value)).not.toBeInTheDocument();
  });
});
