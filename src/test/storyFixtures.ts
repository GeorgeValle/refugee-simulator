import {
  AGE_BAND,
  createSession,
  type FamilyMember,
  type GameSession,
  GENDER,
  LOSS_CAUSE,
  RELATIONSHIP,
  type SaveSlotId,
  SLIP_STATUS,
  STORY_STEP,
  type StoryStep,
} from "@/game/model";
import { GAME_EVENT, gameReducer } from "@/game/reducer";

const FAMILY: FamilyMember[] = [
  { id: "family-1", name: "Lina", relationship: RELATIONSHIP.WIFE },
  { id: "family-2", name: "Mariam", relationship: RELATIONSHIP.DAUGHTER },
  { id: "family-3", name: "Omar", relationship: RELATIONSHIP.BROTHER },
  { id: "family-4", name: "Samira", relationship: RELATIONSHIP.MOTHER },
];

export function createStorySessions(slotId: SaveSlotId = 1): GameSession[] {
  const sessions: GameSession[] = [];
  let session = createSession(slotId, 1_000);
  sessions.push(session);

  session = gameReducer(session, {
    type: GAME_EVENT.SET_PROFILE,
    profile: { gender: GENDER.MAN, ageBand: AGE_BAND.YOUTH },
    now: 1_100,
  });
  sessions.push(session);

  session = gameReducer(session, {
    type: GAME_EVENT.GO_TO,
    step: STORY_STEP.TELEVISION,
    now: 1_200,
  });
  sessions.push(session);
  session = gameReducer(session, { type: GAME_EVENT.GO_TO, step: STORY_STEP.FAMILY, now: 1_300 });
  sessions.push(session);

  session = gameReducer(session, { type: GAME_EVENT.SET_FAMILY, family: FAMILY, now: 1_400 });
  sessions.push(session);
  session = gameReducer(session, {
    type: GAME_EVENT.SET_PACKING,
    packing: {
      objects: ["foto", "llaves", "botella", "cuaderno"],
      profession: "docente",
      skill: "reparar bicicletas",
      clothing: "abrigo azul",
      dream: "abrir una escuela",
    },
    now: 1_500,
  });
  sessions.push(session);

  const firstLossIds = session.slips.slice(0, 2).map(({ id }) => id);
  for (const [index, slipId] of firstLossIds.entries()) {
    session = gameReducer(session, {
      type: GAME_EVENT.TOGGLE_PENDING_LOSS,
      slipId,
      now: 1_600 + index,
    });
  }
  session = gameReducer(session, {
    type: GAME_EVENT.COMMIT_SELECTED_LOSSES,
    cause: LOSS_CAUSE.FIRST_DEPARTURE,
    now: 1_700,
  });
  session = gameReducer(session, { type: GAME_EVENT.GO_TO, step: STORY_STEP.VILLAGE, now: 1_800 });
  sessions.push(session);

  session = gameReducer(session, { type: GAME_EVENT.START_TIMED_LOSS, now: 2_000 });
  sessions.push(session);
  session = gameReducer(session, {
    type: GAME_EVENT.COMMIT_TIMED_LOSSES,
    random: () => 0,
    now: 2_100,
  });
  sessions.push(session);

  session = gameReducer(session, { type: GAME_EVENT.GO_TO, step: STORY_STEP.FOREST, now: 2_200 });
  sessions.push(session);
  session = gameReducer(session, {
    type: GAME_EVENT.GO_TO,
    step: STORY_STEP.ARMED_ENCOUNTER,
    now: 2_300,
  });
  sessions.push(session);
  session = gameReducer(session, {
    type: GAME_EVENT.APPLY_RANDOM_LOSSES,
    cause: LOSS_CAUSE.ARMED_GROUP,
    count: 2,
    nextStep: STORY_STEP.CAMP,
    random: () => 0,
    now: 2_400,
  });
  sessions.push(session);
  session = gameReducer(session, { type: GAME_EVENT.GO_TO, step: STORY_STEP.ENDING, now: 2_500 });
  sessions.push(session);

  return sessions;
}

export function createStorySession(step: StoryStep, slotId: SaveSlotId = 1): GameSession {
  const session = createStorySessions(slotId).find((candidate) => candidate.step === step);
  if (!session) throw new Error(`Missing story fixture for ${step}`);
  return session;
}

export function activeSlipId(session: GameSession): string {
  const slip = session.slips.find(({ status }) => status === SLIP_STATUS.ACTIVE);
  if (!slip) throw new Error("Expected an active slip");
  return slip.id;
}
