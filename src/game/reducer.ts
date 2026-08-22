import {
  type CharacterProfile,
  createId,
  type FamilyMember,
  type GameSession,
  LOSS_CAUSE,
  type LossCause,
  type MemorySlip,
  SLIP_CATEGORY,
  SLIP_KIND,
  SLIP_STATUS,
  STORY_STEP,
  type StoryStep,
} from "@/game/model";

export const GAME_EVENT = {
  SET_PROFILE: "setProfile",
  SET_FAMILY: "setFamily",
  SET_PACKING: "setPacking",
  GO_TO: "goTo",
  TOGGLE_PENDING_LOSS: "togglePendingLoss",
  COMMIT_SELECTED_LOSSES: "commitSelectedLosses",
  START_TIMED_LOSS: "startTimedLoss",
  COMMIT_TIMED_LOSSES: "commitTimedLosses",
  APPLY_RANDOM_LOSSES: "applyRandomLosses",
  PAUSE_TIMER: "pauseTimer",
  RESUME_TIMER: "resumeTimer",
} as const;

interface PackingPayload {
  objects: string[];
  profession: string;
  skill: string;
  clothing: string;
  dream: string;
}

export type GameEvent =
  | { type: typeof GAME_EVENT.SET_PROFILE; profile: CharacterProfile; now?: number }
  | { type: typeof GAME_EVENT.SET_FAMILY; family: FamilyMember[]; now?: number }
  | { type: typeof GAME_EVENT.SET_PACKING; packing: PackingPayload; now?: number }
  | { type: typeof GAME_EVENT.GO_TO; step: StoryStep; now?: number }
  | { type: typeof GAME_EVENT.TOGGLE_PENDING_LOSS; slipId: string; now?: number }
  | {
      type: typeof GAME_EVENT.COMMIT_SELECTED_LOSSES;
      cause: LossCause;
      now?: number;
    }
  | { type: typeof GAME_EVENT.START_TIMED_LOSS; now?: number }
  | { type: typeof GAME_EVENT.COMMIT_TIMED_LOSSES; now?: number; random?: () => number }
  | {
      type: typeof GAME_EVENT.APPLY_RANDOM_LOSSES;
      cause: LossCause;
      count: number;
      nextStep: StoryStep;
      now?: number;
      random?: () => number;
    }
  | { type: typeof GAME_EVENT.PAUSE_TIMER; now?: number }
  | { type: typeof GAME_EVENT.RESUME_TIMER; now?: number };

function toFamilySlip(member: FamilyMember): MemorySlip {
  return {
    id: `slip-${member.id}`,
    category: SLIP_CATEGORY.FAMILY,
    kind: SLIP_KIND.FAMILY,
    value: member.name,
    relatedName: member.name,
    relationship: member.relationship,
    status: SLIP_STATUS.ACTIVE,
    lossCause: null,
    lostAt: null,
  };
}

function toCustomSlip(kind: MemorySlip["kind"], value: string): MemorySlip {
  return {
    id: createId(`slip-${kind}`),
    category: kind === SLIP_KIND.OBJECT ? SLIP_CATEGORY.OBJECT : SLIP_CATEGORY.IDENTITY,
    kind,
    value: value.trim(),
    relatedName: null,
    relationship: null,
    status: SLIP_STATUS.ACTIVE,
    lossCause: null,
    lostAt: null,
  };
}

function pickRandomIds(candidates: string[], count: number, random: () => number): string[] {
  const pool = [...candidates];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    const [id] = pool.splice(index, 1);
    if (id) picked.push(id);
  }
  return picked;
}

function markLosses(
  session: GameSession,
  ids: string[],
  cause: LossCause,
  now: number,
): GameSession {
  const uniqueIds = new Set(ids);
  const validIds = session.slips
    .filter((slip) => slip.status === SLIP_STATUS.ACTIVE && uniqueIds.has(slip.id))
    .map((slip) => slip.id);
  return {
    ...session,
    slips: session.slips.map((slip) =>
      validIds.includes(slip.id)
        ? { ...slip, status: SLIP_STATUS.LOST, lossCause: cause, lostAt: now }
        : slip,
    ),
    losses: [...session.losses, ...validIds.map((slipId) => ({ slipId, cause, lostAt: now }))],
    pendingLossIds: [],
    updatedAt: now,
  };
}

export function gameReducer(session: GameSession, event: GameEvent): GameSession {
  const now = event.now ?? Date.now();
  switch (event.type) {
    case GAME_EVENT.SET_PROFILE:
      return {
        ...session,
        profile: event.profile,
        step: STORY_STEP.APARTMENT,
        updatedAt: now,
      };
    case GAME_EVENT.SET_FAMILY:
      return {
        ...session,
        family: event.family,
        slips: event.family.map(toFamilySlip),
        step: STORY_STEP.PACKING,
        updatedAt: now,
      };
    case GAME_EVENT.SET_PACKING: {
      const familySlips = session.slips.filter((slip) => slip.category === SLIP_CATEGORY.FAMILY);
      const customSlips = [
        ...event.packing.objects.map((value) => toCustomSlip(SLIP_KIND.OBJECT, value)),
        toCustomSlip(SLIP_KIND.PROFESSION, event.packing.profession),
        toCustomSlip(SLIP_KIND.SKILL, event.packing.skill),
        toCustomSlip(SLIP_KIND.CLOTHING, event.packing.clothing),
        toCustomSlip(SLIP_KIND.DREAM, event.packing.dream),
      ];
      return {
        ...session,
        slips: [...familySlips, ...customSlips],
        step: STORY_STEP.FIRST_LOSS,
        updatedAt: now,
      };
    }
    case GAME_EVENT.GO_TO:
      return {
        ...session,
        step: event.step,
        pendingLossIds: [],
        updatedAt: now,
      };
    case GAME_EVENT.TOGGLE_PENDING_LOSS: {
      const selectable = session.slips.some(
        (slip) => slip.id === event.slipId && slip.status === SLIP_STATUS.ACTIVE,
      );
      if (!selectable) return session;
      const isSelected = session.pendingLossIds.includes(event.slipId);
      if (!isSelected && session.pendingLossIds.length >= 2) return session;
      return {
        ...session,
        pendingLossIds: isSelected
          ? session.pendingLossIds.filter((id) => id !== event.slipId)
          : [...session.pendingLossIds, event.slipId],
        updatedAt: now,
      };
    }
    case GAME_EVENT.COMMIT_SELECTED_LOSSES: {
      if (session.pendingLossIds.length !== 2) return session;
      return markLosses(session, session.pendingLossIds, event.cause, now);
    }
    case GAME_EVENT.START_TIMED_LOSS:
      return {
        ...session,
        step: STORY_STEP.TIMED_LOSS,
        pendingLossIds: [],
        timerDeadline: now + 10_000,
        timerRemainingMs: null,
        updatedAt: now,
      };
    case GAME_EVENT.COMMIT_TIMED_LOSSES: {
      if (session.step !== STORY_STEP.TIMED_LOSS) return session;
      const random = event.random ?? Math.random;
      const remaining = session.slips
        .filter(
          (slip) => slip.status === SLIP_STATUS.ACTIVE && !session.pendingLossIds.includes(slip.id),
        )
        .map((slip) => slip.id);
      const selected = session.pendingLossIds.slice(0, 2);
      const randomIds = pickRandomIds(remaining, 2 - selected.length, random);
      const withLosses = markLosses(
        session,
        [...selected, ...randomIds],
        LOSS_CAUSE.VILLAGE_ESCAPE,
        now,
      );
      return {
        ...withLosses,
        step: STORY_STEP.JOURNEY,
        timerDeadline: null,
        timerRemainingMs: null,
      };
    }
    case GAME_EVENT.APPLY_RANDOM_LOSSES: {
      if (session.step !== STORY_STEP.ARMED_ENCOUNTER) return session;
      const random = event.random ?? Math.random;
      const candidates = session.slips
        .filter((slip) => slip.status === SLIP_STATUS.ACTIVE)
        .map((slip) => slip.id);
      const ids = pickRandomIds(candidates, event.count, random);
      return {
        ...markLosses(session, ids, event.cause, now),
        step: event.nextStep,
      };
    }
    case GAME_EVENT.PAUSE_TIMER: {
      if (session.step !== STORY_STEP.TIMED_LOSS || session.timerDeadline === null) return session;
      return {
        ...session,
        timerRemainingMs: Math.max(0, session.timerDeadline - now),
        timerDeadline: null,
        updatedAt: now,
      };
    }
    case GAME_EVENT.RESUME_TIMER: {
      if (session.step !== STORY_STEP.TIMED_LOSS || session.timerRemainingMs === null) {
        return session;
      }
      return {
        ...session,
        timerDeadline: now + session.timerRemainingMs,
        timerRemainingMs: null,
        updatedAt: now,
      };
    }
  }
}
