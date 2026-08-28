import { describe, expect, it } from "vitest";
import { AGE_BAND, LOSS_CAUSE, SLIP_CATEGORY, SLIP_STATUS, STORY_STEP } from "@/game/model";
import { GAME_EVENT, gameReducer } from "@/game/reducer";
import { gameSessionSchema } from "@/game/schema";
import { createStorySession, createStorySessions } from "@/test/storyFixtures";

describe("game session invariants", () => {
  it("accepts reducer-built sessions from every stable story chapter", () => {
    for (const session of createStorySessions()) {
      expect(gameSessionSchema.safeParse(session).success, session.step).toBe(true);
    }
  });

  it("accepts both the new arrival chapter and legacy saves at the village warning", () => {
    const arrival = createStorySession(STORY_STEP.VILLAGE_ARRIVAL);
    const legacyWarning = createStorySession(STORY_STEP.VILLAGE);

    expect(arrival.schemaVersion).toBe(1);
    expect(arrival.losses).toHaveLength(2);
    expect(arrival.timerDeadline).toBeNull();
    expect(gameSessionSchema.safeParse(arrival).success).toBe(true);
    expect(gameSessionSchema.safeParse(legacyWarning).success).toBe(true);
  });

  it("accepts either a running or paused timer, but never both", () => {
    const running = createStorySession(STORY_STEP.TIMED_LOSS);
    const paused = gameReducer(running, { type: GAME_EVENT.PAUSE_TIMER, now: 2_050 });
    expect(gameSessionSchema.safeParse(running).success).toBe(true);
    expect(gameSessionSchema.safeParse(paused).success).toBe(true);
    expect(gameSessionSchema.safeParse({ ...running, timerRemainingMs: 5_000 }).success).toBe(
      false,
    );
    expect(gameSessionSchema.safeParse({ ...running, timerDeadline: null }).success).toBe(false);
  });

  it("rejects missing profiles and duplicate domain IDs", () => {
    const packing = createStorySession(STORY_STEP.PACKING);
    expect(gameSessionSchema.safeParse({ ...packing, profile: null }).success).toBe(false);
    expect(
      gameSessionSchema.safeParse({
        ...packing,
        family: packing.family.map((member, index) =>
          index === 1 ? { ...member, id: packing.family[0]?.id ?? member.id } : member,
        ),
      }).success,
    ).toBe(false);

    const firstLoss = createStorySession(STORY_STEP.FIRST_LOSS);
    expect(
      gameSessionSchema.safeParse({
        ...firstLoss,
        slips: firstLoss.slips.map((slip, index) =>
          index === 1 ? { ...slip, id: firstLoss.slips[0]?.id ?? slip.id } : slip,
        ),
      }).success,
    ).toBe(false);
  });

  it("rejects divergent loss records, active loss data, and inactive pending choices", () => {
    const village = createStorySession(STORY_STEP.VILLAGE);
    const [firstLoss] = village.losses;
    if (!firstLoss) throw new Error("Expected a loss fixture");
    expect(
      gameSessionSchema.safeParse({
        ...village,
        losses: village.losses.map((loss, index) =>
          index === 0 ? { ...loss, cause: LOSS_CAUSE.ARMED_GROUP } : loss,
        ),
      }).success,
    ).toBe(false);

    const firstLossStep = createStorySession(STORY_STEP.FIRST_LOSS);
    expect(
      gameSessionSchema.safeParse({
        ...firstLossStep,
        slips: firstLossStep.slips.map((slip, index) =>
          index === 0
            ? {
                ...slip,
                status: SLIP_STATUS.ACTIVE,
                lossCause: LOSS_CAUSE.FIRST_DEPARTURE,
                lostAt: 1_700,
              }
            : slip,
        ),
      }).success,
    ).toBe(false);

    const timed = createStorySession(STORY_STEP.TIMED_LOSS);
    expect(
      gameSessionSchema.safeParse({ ...timed, pendingLossIds: [firstLoss.slipId] }).success,
    ).toBe(false);
  });

  it("rejects incoherent slip categories and age-ineligible family relationships", () => {
    const firstLoss = createStorySession(STORY_STEP.FIRST_LOSS);
    expect(
      gameSessionSchema.safeParse({
        ...firstLoss,
        slips: firstLoss.slips.map((slip, index) =>
          index === 4 ? { ...slip, category: SLIP_CATEGORY.IDENTITY } : slip,
        ),
      }).success,
    ).toBe(false);

    expect(
      gameSessionSchema.safeParse({
        ...firstLoss,
        profile: { ...firstLoss.profile, ageBand: AGE_BAND.CHILDHOOD },
      }).success,
    ).toBe(false);
  });
});
