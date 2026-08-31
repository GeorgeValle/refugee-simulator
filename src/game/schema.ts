import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/game/locales";
import {
  AGE_BAND,
  type AudioPreferences,
  type GameSession,
  GENDER,
  getPersistedEligibleRelationships,
  LOSS_CAUSE,
  type MemorySlip,
  RELATIONSHIP,
  REPEATABLE_RELATIONSHIPS,
  type Relationship,
  SLIP_CATEGORY,
  SLIP_KIND,
  SLIP_STATUS,
  STORY_STEP,
  usesSportSlip,
} from "@/game/model";
import { UNLOCKABLE_ID, UNLOCKABLE_IDS, type UnlockableProgress } from "@/game/unlockables";

const characterProfileSchema = z.object({
  gender: z.enum(GENDER),
  ageBand: z.enum(AGE_BAND),
});

const familyMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  relationship: z.enum(RELATIONSHIP),
});

const memorySlipSchema = z.object({
  id: z.string().min(1),
  category: z.enum(SLIP_CATEGORY),
  kind: z.enum(SLIP_KIND),
  value: z.string().trim().min(1).max(120),
  relatedName: z.string().max(40).nullable(),
  relationship: z.enum(RELATIONSHIP).nullable(),
  status: z.enum(SLIP_STATUS),
  lossCause: z.enum(LOSS_CAUSE).nullable(),
  lostAt: z.number().int().nullable(),
});

const lossRecordSchema = z.object({
  slipId: z.string().min(1),
  cause: z.enum(LOSS_CAUSE),
  lostAt: z.number().int(),
});

const gameSessionShape = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  slotId: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  locale: z.enum(SUPPORTED_LOCALES),
  step: z.enum(STORY_STEP),
  profile: characterProfileSchema.nullable(),
  family: z.array(familyMemberSchema).max(4),
  slips: z.array(memorySlipSchema).max(12),
  losses: z.array(lossRecordSchema).max(12),
  pendingLossIds: z.array(z.string()).max(2),
  timerDeadline: z.number().int().nullable(),
  timerRemainingMs: z.number().int().min(0).max(10_000).nullable(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const gameSessionSchema: z.ZodType<GameSession> = gameSessionShape.superRefine(
  (session, context) => {
    const issue = (path: PropertyKey[], message: string) =>
      context.addIssue({ code: "custom", path, message });
    const unique = (values: string[]) => new Set(values).size === values.length;
    const at = (...steps: GameSession["step"][]) => steps.includes(session.step);

    if (session.updatedAt < session.createdAt) {
      issue(["updatedAt"], "updatedAt must not precede createdAt");
    }
    if (!unique(session.family.map(({ id }) => id))) {
      issue(["family"], "family IDs must be unique");
    }
    if (!unique(session.slips.map(({ id }) => id))) {
      issue(["slips"], "slip IDs must be unique");
    }
    if (!unique(session.losses.map(({ slipId }) => slipId))) {
      issue(["losses"], "loss records must reference unique slips");
    }
    if (!unique(session.pendingLossIds)) {
      issue(["pendingLossIds"], "pending loss IDs must be unique");
    }

    for (const [index, slip] of session.slips.entries()) {
      const loss = session.losses.find(({ slipId }) => slipId === slip.id);
      if (slip.status === SLIP_STATUS.ACTIVE) {
        if (slip.lossCause !== null || slip.lostAt !== null || loss) {
          issue(["slips", index], "active slips cannot contain loss data");
        }
      } else if (
        slip.lossCause === null ||
        slip.lostAt === null ||
        !loss ||
        loss.cause !== slip.lossCause ||
        loss.lostAt !== slip.lostAt
      ) {
        issue(["slips", index], "lost slips must match their loss record");
      }

      const familyShape =
        slip.category === SLIP_CATEGORY.FAMILY &&
        slip.kind === SLIP_KIND.FAMILY &&
        slip.relatedName !== null &&
        slip.relationship !== null;
      const objectShape =
        slip.category === SLIP_CATEGORY.OBJECT &&
        slip.kind === SLIP_KIND.OBJECT &&
        slip.relatedName === null &&
        slip.relationship === null;
      const identityShape =
        slip.category === SLIP_CATEGORY.IDENTITY &&
        (
          [
            SLIP_KIND.PROFESSION,
            SLIP_KIND.SPORT,
            SLIP_KIND.SKILL,
            SLIP_KIND.CLOTHING,
            SLIP_KIND.DREAM,
          ] as Array<MemorySlip["kind"]>
        ).includes(slip.kind) &&
        slip.relatedName === null &&
        slip.relationship === null;
      if (!familyShape && !objectShape && !identityShape) {
        issue(["slips", index], "slip category and kind are inconsistent");
      }
    }

    for (const [index, loss] of session.losses.entries()) {
      const slip = session.slips.find(({ id }) => id === loss.slipId);
      if (!slip || slip.status !== SLIP_STATUS.LOST) {
        issue(["losses", index], "loss record must reference a lost slip");
      }
      if (loss.lostAt < session.createdAt || loss.lostAt > session.updatedAt) {
        issue(["losses", index, "lostAt"], "loss date must fit the session lifetime");
      }
    }

    for (const [index, slipId] of session.pendingLossIds.entries()) {
      const slip = session.slips.find(({ id }) => id === slipId);
      if (!slip || slip.status !== SLIP_STATUS.ACTIVE) {
        issue(["pendingLossIds", index], "pending losses must reference active slips");
      }
    }

    if (session.profile) {
      const eligible = new Set(getPersistedEligibleRelationships(session.profile.ageBand));
      const relationshipCounts = new Map<Relationship, number>();
      for (const [index, member] of session.family.entries()) {
        if (!eligible.has(member.relationship)) {
          issue(["family", index, "relationship"], "relationship is not eligible for this age");
        }
        relationshipCounts.set(
          member.relationship,
          (relationshipCounts.get(member.relationship) ?? 0) + 1,
        );
      }
      for (const [relationship, count] of relationshipCounts) {
        if (count > 1 && !REPEATABLE_RELATIONSHIPS.has(relationship)) {
          issue(["family"], "non-repeatable relationships must be unique");
        }
      }
    }

    const familySlips = session.slips.filter(({ kind }) => kind === SLIP_KIND.FAMILY);
    for (const [index, member] of session.family.entries()) {
      const slip = familySlips.find(({ id }) => id === `slip-${member.id}`);
      if (
        !slip ||
        slip.value !== member.name ||
        slip.relatedName !== member.name ||
        slip.relationship !== member.relationship
      ) {
        issue(["family", index], "family member must match exactly one family slip");
      }
    }

    const profileRequired = session.step !== STORY_STEP.CREATE_PROFILE;
    if (profileRequired !== (session.profile !== null)) {
      issue(["profile"], "profile presence is inconsistent with the story step");
    }

    const familyRequired = at(
      STORY_STEP.PACKING,
      STORY_STEP.FIRST_LOSS,
      STORY_STEP.VILLAGE_ARRIVAL,
      STORY_STEP.VILLAGE,
      STORY_STEP.TIMED_LOSS,
      STORY_STEP.JOURNEY,
      STORY_STEP.FOREST,
      STORY_STEP.ARMED_ENCOUNTER,
      STORY_STEP.CAMP,
      STORY_STEP.ENDING,
    );
    if (session.family.length !== (familyRequired ? 4 : 0)) {
      issue(["family"], "family count is inconsistent with the story step");
    }

    const packed = at(
      STORY_STEP.FIRST_LOSS,
      STORY_STEP.VILLAGE_ARRIVAL,
      STORY_STEP.VILLAGE,
      STORY_STEP.TIMED_LOSS,
      STORY_STEP.JOURNEY,
      STORY_STEP.FOREST,
      STORY_STEP.ARMED_ENCOUNTER,
      STORY_STEP.CAMP,
      STORY_STEP.ENDING,
    );
    const expectedSlipCount = packed ? 12 : session.step === STORY_STEP.PACKING ? 4 : 0;
    if (session.slips.length !== expectedSlipCount) {
      issue(["slips"], "slip count is inconsistent with the story step");
    }
    if (packed) {
      const kindCounts = new Map<string, number>();
      for (const slip of session.slips) {
        kindCounts.set(slip.kind, (kindCounts.get(slip.kind) ?? 0) + 1);
      }
      const personalActivityKind =
        session.profile && usesSportSlip(session.profile.ageBand)
          ? SLIP_KIND.SPORT
          : SLIP_KIND.PROFESSION;
      const validComposition =
        kindCounts.get(SLIP_KIND.FAMILY) === 4 &&
        kindCounts.get(SLIP_KIND.OBJECT) === 4 &&
        kindCounts.get(personalActivityKind) === 1 &&
        kindCounts.get(
          personalActivityKind === SLIP_KIND.SPORT ? SLIP_KIND.PROFESSION : SLIP_KIND.SPORT,
        ) === undefined &&
        kindCounts.get(SLIP_KIND.SKILL) === 1 &&
        kindCounts.get(SLIP_KIND.CLOTHING) === 1 &&
        kindCounts.get(SLIP_KIND.DREAM) === 1;
      if (!validComposition) issue(["slips"], "packed slip composition is invalid");
    }

    const expectedLosses = new Map([
      [LOSS_CAUSE.FIRST_DEPARTURE, 0],
      [LOSS_CAUSE.VILLAGE_ESCAPE, 0],
      [LOSS_CAUSE.ARMED_GROUP, 0],
    ]);
    if (
      at(
        STORY_STEP.VILLAGE_ARRIVAL,
        STORY_STEP.VILLAGE,
        STORY_STEP.TIMED_LOSS,
        STORY_STEP.JOURNEY,
        STORY_STEP.FOREST,
        STORY_STEP.ARMED_ENCOUNTER,
        STORY_STEP.CAMP,
        STORY_STEP.ENDING,
      )
    ) {
      expectedLosses.set(LOSS_CAUSE.FIRST_DEPARTURE, 2);
    }
    if (
      at(
        STORY_STEP.JOURNEY,
        STORY_STEP.FOREST,
        STORY_STEP.ARMED_ENCOUNTER,
        STORY_STEP.CAMP,
        STORY_STEP.ENDING,
      )
    ) {
      expectedLosses.set(LOSS_CAUSE.VILLAGE_ESCAPE, 2);
    }
    if (at(STORY_STEP.CAMP, STORY_STEP.ENDING)) {
      expectedLosses.set(LOSS_CAUSE.ARMED_GROUP, 2);
    }
    for (const [cause, count] of expectedLosses) {
      if (session.losses.filter((loss) => loss.cause === cause).length !== count) {
        issue(["losses"], "loss causes are inconsistent with the story step");
      }
    }

    const pendingAllowed = at(STORY_STEP.FIRST_LOSS, STORY_STEP.TIMED_LOSS);
    if (!pendingAllowed && session.pendingLossIds.length > 0) {
      issue(["pendingLossIds"], "pending losses are not allowed in this story step");
    }

    const hasDeadline = session.timerDeadline !== null;
    const hasRemaining = session.timerRemainingMs !== null;
    if (session.step === STORY_STEP.TIMED_LOSS) {
      if (hasDeadline === hasRemaining) {
        issue(["timerDeadline"], "timed loss requires exactly one timer representation");
      }
    } else if (hasDeadline || hasRemaining) {
      issue(["timerDeadline"], "timer data is only allowed during timed loss");
    }
  },
);

export const audioPreferencesSchema: z.ZodType<AudioPreferences> = z.object({
  music: z.number().min(0).max(1),
  effects: z.number().min(0).max(1),
  voices: z.number().min(0).max(1),
  muted: z.boolean(),
  captions: z.boolean(),
  reducedMotion: z.boolean(),
});

export const unlockableProgressSchema: z.ZodType<UnlockableProgress> = z
  .object({
    schemaVersion: z.literal(1),
    entries: z
      .array(
        z.object({
          id: z.enum(UNLOCKABLE_ID),
          unlockedAt: z.number().int().nonnegative(),
        }),
      )
      .max(UNLOCKABLE_IDS.length),
  })
  .superRefine((progress, context) => {
    if (new Set(progress.entries.map(({ id }) => id)).size !== progress.entries.length) {
      context.addIssue({
        code: "custom",
        path: ["entries"],
        message: "unlockable IDs must be unique",
      });
    }
  });

export const familyInputSchema = z.object({
  family: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(40),
        relationship: z.enum(RELATIONSHIP),
      }),
    )
    .length(4),
});

export const packingInputSchema = z.object({
  objects: z.array(z.string().trim().min(1).max(60)).length(4),
  personalActivity: z.string().trim().min(1).max(60),
  skill: z.string().trim().min(1).max(60),
  clothing: z.string().trim().min(1).max(60),
  dream: z.string().trim().min(1).max(120),
});
