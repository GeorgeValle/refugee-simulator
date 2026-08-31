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
  RELATIONSHIP.NIECE,
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

const PARTNER_RELATIONSHIPS: ReadonlySet<Relationship> = new Set([
  RELATIONSHIP.WIFE,
  RELATIONSHIP.HUSBAND,
]);

const NEPHEW_RELATIONSHIPS: ReadonlySet<Relationship> = new Set([
  RELATIONSHIP.NEPHEW,
  RELATIONSHIP.NIECE,
]);

export function getRelationshipPortrait(
  relationship: Relationship,
  profileAgeBand: AgeBand,
): PortraitDescriptor {
  const gender = FEMALE_RELATIONSHIPS.has(relationship) ? GENDER.WOMAN : GENDER.MAN;
  if (CHILD_RELATIONSHIPS.has(relationship)) {
    return {
      gender,
      ageBand: profileAgeBand === AGE_BAND.OLD_AGE ? AGE_BAND.YOUTH : AGE_BAND.ADOLESCENCE,
    };
  }
  if (SIBLING_RELATIONSHIPS.has(relationship)) {
    return {
      gender,
      ageBand: profileAgeBand === AGE_BAND.OLD_AGE ? AGE_BAND.ADULTHOOD : AGE_BAND.YOUTH,
    };
  }
  if (ELDER_RELATIONSHIPS.has(relationship)) return { gender, ageBand: AGE_BAND.OLD_AGE };
  if (PARENT_RELATIONSHIPS.has(relationship)) {
    return {
      gender,
      ageBand: profileAgeBand === AGE_BAND.ADULTHOOD ? AGE_BAND.OLD_AGE : AGE_BAND.ADULTHOOD,
    };
  }
  if (NEPHEW_RELATIONSHIPS.has(relationship)) return { gender, ageBand: AGE_BAND.YOUTH };
  if (PARTNER_RELATIONSHIPS.has(relationship)) return { gender, ageBand: profileAgeBand };
  return { gender, ageBand: AGE_BAND.YOUTH };
}

export function getPortraitAsset({ gender, ageBand }: PortraitDescriptor): string {
  return `${import.meta.env.BASE_URL}assets/art/protagonist-${gender}-${ageBand}.png`;
}
