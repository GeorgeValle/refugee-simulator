import {
  AGE_BAND,
  type AgeBand,
  GENDER,
  type Gender,
  RELATIONSHIP,
  type Relationship,
} from "@/game/model";

export interface PortraitDescriptor {
  gender: Gender;
  ageBand: AgeBand;
}

const FEMALE_RELATIONSHIPS: ReadonlySet<Relationship> = new Set([
  RELATIONSHIP.DAUGHTER,
  RELATIONSHIP.WIFE,
  RELATIONSHIP.SISTER,
  RELATIONSHIP.AUNT,
  RELATIONSHIP.MOTHER,
  RELATIONSHIP.GRANDMOTHER,
]);

const CHILD_RELATIONSHIPS: ReadonlySet<Relationship> = new Set([
  RELATIONSHIP.DAUGHTER,
  RELATIONSHIP.SON,
]);

const SIBLING_RELATIONSHIPS: ReadonlySet<Relationship> = new Set([
  RELATIONSHIP.BROTHER,
  RELATIONSHIP.SISTER,
]);

const ELDER_RELATIONSHIPS: ReadonlySet<Relationship> = new Set([
  RELATIONSHIP.GRANDFATHER,
  RELATIONSHIP.GRANDMOTHER,
]);

const PARENT_RELATIONSHIPS: ReadonlySet<Relationship> = new Set([
  RELATIONSHIP.FATHER,
  RELATIONSHIP.MOTHER,
  RELATIONSHIP.UNCLE,
  RELATIONSHIP.AUNT,
]);

export function getRelationshipPortrait(relationship: Relationship): PortraitDescriptor {
  const gender = FEMALE_RELATIONSHIPS.has(relationship) ? GENDER.WOMAN : GENDER.MAN;
  if (CHILD_RELATIONSHIPS.has(relationship)) return { gender, ageBand: AGE_BAND.CHILDHOOD };
  if (SIBLING_RELATIONSHIPS.has(relationship)) {
    return { gender, ageBand: AGE_BAND.ADOLESCENCE };
  }
  if (ELDER_RELATIONSHIPS.has(relationship)) return { gender, ageBand: AGE_BAND.OLD_AGE };
  if (PARENT_RELATIONSHIPS.has(relationship)) return { gender, ageBand: AGE_BAND.ADULTHOOD };
  return { gender, ageBand: AGE_BAND.YOUTH };
}

export function getPortraitAsset({ gender, ageBand }: PortraitDescriptor): string {
  return `/assets/art/protagonist-${gender}-${ageBand}.png`;
}
