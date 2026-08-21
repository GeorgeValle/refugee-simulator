import { describe, expect, it } from "vitest";
import {
  AGE_BAND,
  createSession,
  type FamilyMember,
  type GameSession,
  GENDER,
  LOSS_CAUSE,
  RELATIONSHIP,
  SLIP_STATUS,
  STORY_STEP,
} from "@/game/model";
import { GAME_EVENT, gameReducer } from "@/game/reducer";

const family: FamilyMember[] = [
  { id: "family-1", name: "Lina", relationship: RELATIONSHIP.WIFE },
  { id: "family-2", name: "Mariam", relationship: RELATIONSHIP.DAUGHTER },
  { id: "family-3", name: "Omar", relationship: RELATIONSHIP.BROTHER },
  { id: "family-4", name: "Samira", relationship: RELATIONSHIP.MOTHER },
];

function createPackedSession(): GameSession {
  let session = createSession(1, 1_000);
  session = gameReducer(session, {
    type: GAME_EVENT.SET_PROFILE,
    profile: { gender: GENDER.MAN, ageBand: AGE_BAND.YOUTH },
    now: 1_100,
  });
  session = gameReducer(session, { type: GAME_EVENT.SET_FAMILY, family, now: 1_200 });
  return gameReducer(session, {
    type: GAME_EVENT.SET_PACKING,
    packing: {
      objects: ["foto", "llaves", "botella", "cuaderno"],
      profession: "docente",
      skill: "reparar bicicletas",
      clothing: "abrigo azul",
      dream: "abrir una escuela",
    },
    now: 1_300,
  });
}

function reachTimedLoss(): GameSession {
  let session = createPackedSession();
  const [first, second] = session.slips;
  if (!first || !second) throw new Error("Expected packed slips");
  session = gameReducer(session, {
    type: GAME_EVENT.TOGGLE_PENDING_LOSS,
    slipId: first.id,
    now: 1_400,
  });
  session = gameReducer(session, {
    type: GAME_EVENT.TOGGLE_PENDING_LOSS,
    slipId: second.id,
    now: 1_401,
  });
  session = gameReducer(session, {
    type: GAME_EVENT.COMMIT_SELECTED_LOSSES,
    cause: LOSS_CAUSE.FIRST_DEPARTURE,
    now: 1_500,
  });
  session = gameReducer(session, {
    type: GAME_EVENT.GO_TO,
    step: STORY_STEP.VILLAGE,
    now: 1_600,
  });
  return gameReducer(session, { type: GAME_EVENT.START_TIMED_LOSS, now: 2_000 });
}

describe("game reducer", () => {
  it("builds exactly twelve slips from family and packing answers", () => {
    const session = createPackedSession();
    expect(session.step).toBe(STORY_STEP.FIRST_LOSS);
    expect(session.slips).toHaveLength(12);
    expect(session.slips.filter((slip) => slip.relationship)).toHaveLength(4);
  });

  it("limits manual pending losses to two and records each loss once", () => {
    let session = createPackedSession();
    for (const slip of session.slips.slice(0, 3)) {
      session = gameReducer(session, {
        type: GAME_EVENT.TOGGLE_PENDING_LOSS,
        slipId: slip.id,
        now: 1_400,
      });
    }
    expect(session.pendingLossIds).toHaveLength(2);

    session = gameReducer(session, {
      type: GAME_EVENT.COMMIT_SELECTED_LOSSES,
      cause: LOSS_CAUSE.FIRST_DEPARTURE,
      now: 1_500,
    });
    expect(session.losses).toHaveLength(2);
    expect(session.slips.filter((slip) => slip.status === SLIP_STATUS.LOST)).toHaveLength(2);
  });

  it("fills one missing timed choice at random and does not reroll after leaving the step", () => {
    let session = reachTimedLoss();
    const selected = session.slips.find((slip) => slip.status === SLIP_STATUS.ACTIVE);
    if (!selected) throw new Error("Expected an active slip");
    session = gameReducer(session, {
      type: GAME_EVENT.TOGGLE_PENDING_LOSS,
      slipId: selected.id,
      now: 2_100,
    });
    session = gameReducer(session, {
      type: GAME_EVENT.COMMIT_TIMED_LOSSES,
      random: () => 0,
      now: 12_000,
    });
    expect(session.step).toBe(STORY_STEP.JOURNEY);
    expect(session.losses).toHaveLength(4);
    expect(session.losses.filter((loss) => loss.cause === LOSS_CAUSE.VILLAGE_ESCAPE)).toHaveLength(
      2,
    );

    const afterDuplicate = gameReducer(session, {
      type: GAME_EVENT.COMMIT_TIMED_LOSSES,
      random: () => 0.99,
      now: 12_001,
    });
    expect(afterDuplicate).toBe(session);
  });

  it("chooses two timed losses when the player chooses none", () => {
    const session = gameReducer(reachTimedLoss(), {
      type: GAME_EVENT.COMMIT_TIMED_LOSSES,
      random: () => 0,
      now: 12_000,
    });
    expect(session.losses.filter((loss) => loss.cause === LOSS_CAUSE.VILLAGE_ESCAPE)).toHaveLength(
      2,
    );
  });

  it("freezes and resumes the exact remaining timer duration", () => {
    let session = reachTimedLoss();
    expect(session.timerDeadline).toBe(12_000);
    session = gameReducer(session, { type: GAME_EVENT.PAUSE_TIMER, now: 4_500 });
    expect(session.timerDeadline).toBeNull();
    expect(session.timerRemainingMs).toBe(7_500);
    session = gameReducer(session, { type: GAME_EVENT.RESUME_TIMER, now: 8_000 });
    expect(session.timerDeadline).toBe(15_500);
    expect(session.timerRemainingMs).toBeNull();
  });

  it("applies exactly two armed-group losses and ignores duplicate commits", () => {
    let session = reachTimedLoss();
    session = gameReducer(session, {
      type: GAME_EVENT.COMMIT_TIMED_LOSSES,
      random: () => 0,
      now: 12_000,
    });
    session = gameReducer(session, {
      type: GAME_EVENT.GO_TO,
      step: STORY_STEP.ARMED_ENCOUNTER,
      now: 13_000,
    });
    session = gameReducer(session, {
      type: GAME_EVENT.APPLY_RANDOM_LOSSES,
      cause: LOSS_CAUSE.ARMED_GROUP,
      count: 2,
      nextStep: STORY_STEP.CAMP,
      random: () => 0,
      now: 13_100,
    });
    expect(session.step).toBe(STORY_STEP.CAMP);
    expect(session.losses).toHaveLength(6);

    const afterDuplicate = gameReducer(session, {
      type: GAME_EVENT.APPLY_RANDOM_LOSSES,
      cause: LOSS_CAUSE.ARMED_GROUP,
      count: 2,
      nextStep: STORY_STEP.CAMP,
      random: () => 0.9,
      now: 13_200,
    });
    expect(afterDuplicate).toBe(session);
  });
});
