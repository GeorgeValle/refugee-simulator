import { describe, expect, it } from "vitest";
import {
  AGE_BAND,
  type AgeBand,
  type GameSession,
  RELATIONSHIP,
  type Relationship,
  SLIP_KIND,
  SLIP_STATUS,
  type SlipKind,
  STORY_STEP,
} from "@/game/model";
import {
  analyzeArrival,
  evaluateUnlockables,
  UNLOCKABLE_ID,
  unlockableEntriesFromSessions,
} from "@/game/unlockables";
import { createStorySession } from "@/test/storyFixtures";

interface ArrivalOptions {
  ageBand: AgeBand;
  activeFamily: Relationship[];
  dreamRemains?: boolean;
  professionRemains?: boolean;
  updatedAt?: number;
}

const ALWAYS_ACTIVE_KINDS: ReadonlySet<SlipKind> = new Set([
  SLIP_KIND.OBJECT,
  SLIP_KIND.SKILL,
  SLIP_KIND.CLOTHING,
]);

function createArrival(options: ArrivalOptions): GameSession {
  const session = createStorySession(STORY_STEP.CAMP);
  return {
    ...session,
    profile: session.profile ? { ...session.profile, ageBand: options.ageBand } : null,
    updatedAt: options.updatedAt ?? session.updatedAt,
    slips: session.slips.map((slip) => {
      const active =
        (slip.kind === SLIP_KIND.FAMILY &&
          slip.relationship !== null &&
          options.activeFamily.includes(slip.relationship)) ||
        (slip.kind === SLIP_KIND.DREAM && options.dreamRemains === true) ||
        (slip.kind === SLIP_KIND.PROFESSION && options.professionRemains === true) ||
        ALWAYS_ACTIVE_KINDS.has(slip.kind);
      return {
        ...slip,
        status: active ? SLIP_STATUS.ACTIVE : SLIP_STATUS.LOST,
      };
    }),
  };
}

describe("unlockable journey evaluation", () => {
  it("does not unlock anything before reaching camp", () => {
    expect(evaluateUnlockables(createStorySession(STORY_STEP.ARMED_ENCOUNTER))).toEqual([]);
  });

  it("unlocks family, age, dream, and profession journeys together", () => {
    const session = createArrival({
      ageBand: AGE_BAND.YOUTH,
      activeFamily: [
        RELATIONSHIP.WIFE,
        RELATIONSHIP.DAUGHTER,
        RELATIONSHIP.BROTHER,
        RELATIONSHIP.MOTHER,
      ],
      dreamRemains: true,
      professionRemains: true,
    });

    expect(evaluateUnlockables(session)).toEqual([
      UNLOCKABLE_ID.YOUTH_ARRIVAL,
      UNLOCKABLE_ID.FAMILY_TOGETHER,
      UNLOCKABLE_ID.DREAM_REMAINS,
      UNLOCKABLE_ID.PROFESSION_REMAINS,
    ]);
  });

  it("requires a spouse to be the only active family member", () => {
    const spouseOnly = createArrival({
      ageBand: AGE_BAND.ADULTHOOD,
      activeFamily: [RELATIONSHIP.WIFE],
    });
    expect(analyzeArrival(spouseOnly)?.spouseIsOnlyFamily).toBe(true);
    expect(evaluateUnlockables(spouseOnly)).toContain(UNLOCKABLE_ID.SPOUSE_ONLY);

    const spouseAndSibling = createArrival({
      ageBand: AGE_BAND.ADULTHOOD,
      activeFamily: [RELATIONSHIP.WIFE, RELATIONSHIP.BROTHER],
    });
    expect(analyzeArrival(spouseAndSibling)?.spouseIsOnlyFamily).toBe(false);
    expect(evaluateUnlockables(spouseAndSibling)).not.toContain(UNLOCKABLE_ID.SPOUSE_ONLY);
  });

  it.each([
    [AGE_BAND.CHILDHOOD, UNLOCKABLE_ID.CHILDHOOD_ARRIVAL],
    [AGE_BAND.ADOLESCENCE, UNLOCKABLE_ID.ADOLESCENCE_ARRIVAL],
    [AGE_BAND.YOUTH, UNLOCKABLE_ID.YOUTH_ARRIVAL],
    [AGE_BAND.ADULTHOOD, UNLOCKABLE_ID.ADULTHOOD_ARRIVAL],
    [AGE_BAND.OLD_AGE, UNLOCKABLE_ID.OLD_AGE_ARRIVAL],
  ])("unlocks the journey for age band %s", (ageBand, expected) => {
    expect(evaluateUnlockables(createArrival({ ageBand, activeFamily: [] }))).toContain(expected);
  });

  it("deduplicates backfilled entries and preserves the earliest arrival", () => {
    const later = createArrival({
      ageBand: AGE_BAND.YOUTH,
      activeFamily: [],
      updatedAt: 5_000,
    });
    const earlier = createArrival({
      ageBand: AGE_BAND.YOUTH,
      activeFamily: [],
      updatedAt: 3_000,
    });

    expect(unlockableEntriesFromSessions([later, earlier])).toContainEqual({
      id: UNLOCKABLE_ID.YOUTH_ARRIVAL,
      unlockedAt: 3_000,
    });
  });
});
