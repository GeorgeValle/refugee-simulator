import {
  AGE_BAND,
  type AgeBand,
  type GameSession,
  RELATIONSHIP,
  SLIP_KIND,
  SLIP_STATUS,
  STORY_STEP,
} from "@/game/model";

export const UNLOCKABLE_ID = {
  FAMILY_TOGETHER: "familyTogether",
  SPOUSE_ONLY: "spouseOnly",
  CHILDHOOD_ARRIVAL: "childhoodArrival",
  ADOLESCENCE_ARRIVAL: "adolescenceArrival",
  YOUTH_ARRIVAL: "youthArrival",
  ADULTHOOD_ARRIVAL: "adulthoodArrival",
  OLD_AGE_ARRIVAL: "oldAgeArrival",
  DREAM_REMAINS: "dreamRemains",
  PROFESSION_REMAINS: "professionRemains",
  SPORT_REMAINS: "sportRemains",
} as const;

export type UnlockableId = (typeof UNLOCKABLE_ID)[keyof typeof UNLOCKABLE_ID];

export const UNLOCKABLE_IDS = Object.values(UNLOCKABLE_ID);

export interface UnlockableEntry {
  id: UnlockableId;
  unlockedAt: number;
}

export interface UnlockableProgress {
  schemaVersion: 1;
  entries: UnlockableEntry[];
}

export interface ArrivalSummary {
  ageBand: AgeBand;
  allFamilyArrived: boolean;
  spouseIsOnlyFamily: boolean;
  dreamRemains: boolean;
  professionRemains: boolean;
  sportRemains: boolean;
}

const AGE_UNLOCKABLES: Readonly<Record<AgeBand, UnlockableId>> = {
  [AGE_BAND.CHILDHOOD]: UNLOCKABLE_ID.CHILDHOOD_ARRIVAL,
  [AGE_BAND.ADOLESCENCE]: UNLOCKABLE_ID.ADOLESCENCE_ARRIVAL,
  [AGE_BAND.YOUTH]: UNLOCKABLE_ID.YOUTH_ARRIVAL,
  [AGE_BAND.ADULTHOOD]: UNLOCKABLE_ID.ADULTHOOD_ARRIVAL,
  [AGE_BAND.OLD_AGE]: UNLOCKABLE_ID.OLD_AGE_ARRIVAL,
};

export const EMPTY_UNLOCKABLE_PROGRESS: UnlockableProgress = {
  schemaVersion: 1,
  entries: [],
};

export function isArrivalStep(session: GameSession): boolean {
  return session.step === STORY_STEP.CAMP || session.step === STORY_STEP.ENDING;
}

export function analyzeArrival(session: GameSession): ArrivalSummary | null {
  if (!isArrivalStep(session) || !session.profile) return null;

  const activeFamily = session.slips.filter(
    (slip) => slip.kind === SLIP_KIND.FAMILY && slip.status === SLIP_STATUS.ACTIVE,
  );
  const activeKinds = new Set(
    session.slips.filter((slip) => slip.status === SLIP_STATUS.ACTIVE).map((slip) => slip.kind),
  );
  const onlyFamily = activeFamily[0];

  return {
    ageBand: session.profile.ageBand,
    allFamilyArrived: activeFamily.length === 4,
    spouseIsOnlyFamily:
      activeFamily.length === 1 &&
      (onlyFamily?.relationship === RELATIONSHIP.WIFE ||
        onlyFamily?.relationship === RELATIONSHIP.HUSBAND),
    dreamRemains: activeKinds.has(SLIP_KIND.DREAM),
    professionRemains: activeKinds.has(SLIP_KIND.PROFESSION),
    sportRemains: activeKinds.has(SLIP_KIND.SPORT),
  };
}

export function evaluateUnlockables(session: GameSession): UnlockableId[] {
  const arrival = analyzeArrival(session);
  if (!arrival) return [];

  const unlocked = [AGE_UNLOCKABLES[arrival.ageBand]];
  if (arrival.allFamilyArrived) unlocked.push(UNLOCKABLE_ID.FAMILY_TOGETHER);
  if (arrival.spouseIsOnlyFamily) unlocked.push(UNLOCKABLE_ID.SPOUSE_ONLY);
  if (arrival.dreamRemains) unlocked.push(UNLOCKABLE_ID.DREAM_REMAINS);
  if (arrival.professionRemains) unlocked.push(UNLOCKABLE_ID.PROFESSION_REMAINS);
  if (
    (arrival.ageBand === AGE_BAND.CHILDHOOD || arrival.ageBand === AGE_BAND.ADOLESCENCE) &&
    arrival.sportRemains
  ) {
    unlocked.push(UNLOCKABLE_ID.SPORT_REMAINS);
  }
  return unlocked;
}

export function unlockableEntriesFromSessions(sessions: readonly GameSession[]): UnlockableEntry[] {
  const byId = new Map<UnlockableId, number>();
  for (const session of sessions) {
    for (const id of evaluateUnlockables(session)) {
      const current = byId.get(id);
      byId.set(
        id,
        current === undefined ? session.updatedAt : Math.min(current, session.updatedAt),
      );
    }
  }
  return [...byId].map(([id, unlockedAt]) => ({ id, unlockedAt }));
}
