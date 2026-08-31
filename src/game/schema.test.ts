import { describe, expect, it } from "vitest";
import {
  AGE_BAND,
  type AgeBand,
  LOSS_CAUSE,
  RELATIONSHIP,
  type Relationship,
  SLIP_CATEGORY,
  SLIP_KIND,
  SLIP_STATUS,
  STORY_STEP,
} from "@/game/model";
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

  it("requires Sport rather than Profession for packed childhood sessions", () => {
    const firstLoss = createStorySession(STORY_STEP.FIRST_LOSS);
    const relationships = [
      RELATIONSHIP.SISTER,
      RELATIONSHIP.BROTHER,
      RELATIONSHIP.MOTHER,
      RELATIONSHIP.FATHER,
    ];
    const family = firstLoss.family.map((member, index) => ({
      ...member,
      relationship: relationships[index] ?? member.relationship,
    }));
    const childhood = {
      ...firstLoss,
      profile: firstLoss.profile ? { ...firstLoss.profile, ageBand: AGE_BAND.CHILDHOOD } : null,
      family,
      slips: firstLoss.slips.map((slip, index) => {
        if (slip.kind === SLIP_KIND.FAMILY) {
          const member = family[index];
          return member
            ? {
                ...slip,
                relationship: member.relationship,
                relatedName: member.name,
                value: member.name,
              }
            : slip;
        }
        return slip.kind === SLIP_KIND.PROFESSION ? { ...slip, kind: SLIP_KIND.SPORT } : slip;
      }),
    };

    expect(gameSessionSchema.safeParse(childhood).success).toBe(true);
    expect(
      gameSessionSchema.safeParse({
        ...childhood,
        slips: childhood.slips.map((slip) =>
          slip.kind === SLIP_KIND.SPORT ? { ...slip, kind: SLIP_KIND.PROFESSION } : slip,
        ),
      }).success,
    ).toBe(false);
  });

  it("accepts formerly valid adult and old-age relationships already stored in a save", () => {
    const firstLoss = createStorySession(STORY_STEP.FIRST_LOSS);
    const lastMember = firstLoss.family[3];
    if (!lastMember) throw new Error("Expected a fourth family member");
    const withLegacyRelationship = (ageBand: AgeBand, relationship: Relationship) => {
      const family = firstLoss.family.map((member) =>
        member.id === lastMember.id ? { ...member, relationship } : member,
      );
      return {
        ...firstLoss,
        profile: firstLoss.profile ? { ...firstLoss.profile, ageBand } : null,
        family,
        slips: firstLoss.slips.map((slip) =>
          slip.id === `slip-${lastMember.id}` ? { ...slip, relationship } : slip,
        ),
      };
    };

    expect(
      gameSessionSchema.safeParse(
        withLegacyRelationship(AGE_BAND.ADULTHOOD, RELATIONSHIP.GRANDMOTHER),
      ).success,
    ).toBe(true);
    expect(
      gameSessionSchema.safeParse(withLegacyRelationship(AGE_BAND.OLD_AGE, RELATIONSHIP.FATHER))
        .success,
    ).toBe(true);
  });
});
