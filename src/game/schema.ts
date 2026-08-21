import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/game/locales";
import {
  AGE_BAND,
  type AudioPreferences,
  type GameSession,
  GENDER,
  LOSS_CAUSE,
  RELATIONSHIP,
  SLIP_CATEGORY,
  SLIP_KIND,
  SLIP_STATUS,
  STORY_STEP,
} from "@/game/model";

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

export const gameSessionSchema: z.ZodType<GameSession> = z.object({
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

export const audioPreferencesSchema: z.ZodType<AudioPreferences> = z.object({
  music: z.number().min(0).max(1),
  effects: z.number().min(0).max(1),
  voices: z.number().min(0).max(1),
  muted: z.boolean(),
  captions: z.boolean(),
  reducedMotion: z.boolean(),
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
  profession: z.string().trim().min(1).max(60),
  skill: z.string().trim().min(1).max(60),
  clothing: z.string().trim().min(1).max(60),
  dream: z.string().trim().min(1).max(120),
});
