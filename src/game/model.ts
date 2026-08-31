import { DEFAULT_LOCALE, type SupportedLocale } from "@/game/locales";

export const GENDER = {
  MAN: "man",
  WOMAN: "woman",
} as const;

export type Gender = (typeof GENDER)[keyof typeof GENDER];

export const AGE_BAND = {
  CHILDHOOD: "childhood",
  ADOLESCENCE: "adolescence",
  YOUTH: "youth",
  ADULTHOOD: "adulthood",
  OLD_AGE: "oldAge",
} as const;

export type AgeBand = (typeof AGE_BAND)[keyof typeof AGE_BAND];

export const RELATIONSHIP = {
  DAUGHTER: "daughter",
  SON: "son",
  WIFE: "wife",
  HUSBAND: "husband",
  BROTHER: "brother",
  SISTER: "sister",
  NEPHEW: "nephew",
  NIECE: "niece",
  UNCLE: "uncle",
  AUNT: "aunt",
  FATHER: "father",
  MOTHER: "mother",
  GRANDFATHER: "grandfather",
  GRANDMOTHER: "grandmother",
} as const;

export type Relationship = (typeof RELATIONSHIP)[keyof typeof RELATIONSHIP];

export const REPEATABLE_RELATIONSHIPS: ReadonlySet<Relationship> = new Set([
  RELATIONSHIP.DAUGHTER,
  RELATIONSHIP.SON,
  RELATIONSHIP.BROTHER,
  RELATIONSHIP.SISTER,
  RELATIONSHIP.NEPHEW,
  RELATIONSHIP.NIECE,
]);

export const STORY_STEP = {
  CREATE_PROFILE: "createProfile",
  APARTMENT: "apartment",
  TELEVISION: "television",
  FAMILY: "family",
  PACKING: "packing",
  FIRST_LOSS: "firstLoss",
  VILLAGE_ARRIVAL: "villageArrival",
  VILLAGE: "village",
  TIMED_LOSS: "timedLoss",
  JOURNEY: "journey",
  FOREST: "forest",
  ARMED_ENCOUNTER: "armedEncounter",
  CAMP: "camp",
  ENDING: "ending",
} as const;

export type StoryStep = (typeof STORY_STEP)[keyof typeof STORY_STEP];

export const SLIP_CATEGORY = {
  FAMILY: "family",
  OBJECT: "object",
  IDENTITY: "identity",
} as const;

export type SlipCategory = (typeof SLIP_CATEGORY)[keyof typeof SLIP_CATEGORY];

export const SLIP_KIND = {
  FAMILY: "family",
  OBJECT: "object",
  PROFESSION: "profession",
  SPORT: "sport",
  SKILL: "skill",
  CLOTHING: "clothing",
  DREAM: "dream",
} as const;

export type SlipKind = (typeof SLIP_KIND)[keyof typeof SLIP_KIND];

export const SLIP_STATUS = {
  ACTIVE: "active",
  LOST: "lost",
} as const;

export type SlipStatus = (typeof SLIP_STATUS)[keyof typeof SLIP_STATUS];

export const LOSS_CAUSE = {
  FIRST_DEPARTURE: "firstDeparture",
  VILLAGE_ESCAPE: "villageEscape",
  ARMED_GROUP: "armedGroup",
} as const;

export type LossCause = (typeof LOSS_CAUSE)[keyof typeof LOSS_CAUSE];

export const SAVE_SLOT_IDS = [1, 2, 3] as const;
export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number];

export interface CharacterProfile {
  gender: Gender;
  ageBand: AgeBand;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: Relationship;
}

export interface MemorySlip {
  id: string;
  category: SlipCategory;
  kind: SlipKind;
  value: string;
  relatedName: string | null;
  relationship: Relationship | null;
  status: SlipStatus;
  lossCause: LossCause | null;
  lostAt: number | null;
}

export interface LossRecord {
  slipId: string;
  cause: LossCause;
  lostAt: number;
}

export interface GameSession {
  schemaVersion: 1;
  id: string;
  slotId: SaveSlotId;
  locale: SupportedLocale;
  step: StoryStep;
  profile: CharacterProfile | null;
  family: FamilyMember[];
  slips: MemorySlip[];
  losses: LossRecord[];
  pendingLossIds: string[];
  timerDeadline: number | null;
  timerRemainingMs: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SaveSlot {
  slotId: SaveSlotId;
  session: GameSession | null;
}

export interface AudioPreferences {
  music: number;
  effects: number;
  voices: number;
  muted: boolean;
  captions: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  music: 0.42,
  effects: 0.68,
  voices: 0.45,
  muted: false,
  captions: true,
  reducedMotion: false,
};

export function getEligibleRelationships(ageBand: AgeBand): Relationship[] {
  const commonEarlyRelationships = [
    RELATIONSHIP.BROTHER,
    RELATIONSHIP.SISTER,
    RELATIONSHIP.UNCLE,
    RELATIONSHIP.AUNT,
    RELATIONSHIP.FATHER,
    RELATIONSHIP.MOTHER,
    RELATIONSHIP.GRANDFATHER,
    RELATIONSHIP.GRANDMOTHER,
  ];
  if (ageBand === AGE_BAND.CHILDHOOD || ageBand === AGE_BAND.ADOLESCENCE) {
    return commonEarlyRelationships;
  }
  if (ageBand === AGE_BAND.YOUTH) return Object.values(RELATIONSHIP);
  if (ageBand === AGE_BAND.ADULTHOOD) {
    return [
      RELATIONSHIP.DAUGHTER,
      RELATIONSHIP.SON,
      RELATIONSHIP.WIFE,
      RELATIONSHIP.HUSBAND,
      RELATIONSHIP.BROTHER,
      RELATIONSHIP.SISTER,
      RELATIONSHIP.FATHER,
      RELATIONSHIP.MOTHER,
    ];
  }
  return [
    RELATIONSHIP.DAUGHTER,
    RELATIONSHIP.SON,
    RELATIONSHIP.WIFE,
    RELATIONSHIP.HUSBAND,
    RELATIONSHIP.BROTHER,
    RELATIONSHIP.SISTER,
    RELATIONSHIP.NEPHEW,
    RELATIONSHIP.NIECE,
  ];
}

export function usesSportSlip(ageBand: AgeBand): boolean {
  return ageBand === AGE_BAND.CHILDHOOD || ageBand === AGE_BAND.ADOLESCENCE;
}

export function canAddRelationship(
  relationship: Relationship,
  existingRelationships: Relationship[],
): boolean {
  return (
    REPEATABLE_RELATIONSHIPS.has(relationship) || !existingRelationships.includes(relationship)
  );
}

export function createId(prefix: string): string {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `${prefix}-${id}`;
}

export function createSession(slotId: SaveSlotId, now = Date.now()): GameSession {
  return {
    schemaVersion: 1,
    id: createId("session"),
    slotId,
    locale: DEFAULT_LOCALE,
    step: STORY_STEP.CREATE_PROFILE,
    profile: null,
    family: [],
    slips: [],
    losses: [],
    pendingLossIds: [],
    timerDeadline: null,
    timerRemainingMs: null,
    createdAt: now,
    updatedAt: now,
  };
}
