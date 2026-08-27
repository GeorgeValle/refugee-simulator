import { cleanup, render, screen } from "@testing-library/react";
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
});
