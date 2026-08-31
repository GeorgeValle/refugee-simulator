import { describe, expect, it } from "vitest";
import { AGE_BAND, GENDER, RELATIONSHIP } from "@/game/model";
import { getRelationshipPortrait } from "@/game/portraits";

describe("relationship portraits", () => {
  it("uses age-relative portraits for elder family members", () => {
    expect(getRelationshipPortrait(RELATIONSHIP.WIFE, AGE_BAND.OLD_AGE)).toEqual({
      gender: GENDER.WOMAN,
      ageBand: AGE_BAND.OLD_AGE,
    });
    expect(getRelationshipPortrait(RELATIONSHIP.BROTHER, AGE_BAND.OLD_AGE)).toEqual({
      gender: GENDER.MAN,
      ageBand: AGE_BAND.ADULTHOOD,
    });
    expect(getRelationshipPortrait(RELATIONSHIP.DAUGHTER, AGE_BAND.OLD_AGE)).toEqual({
      gender: GENDER.WOMAN,
      ageBand: AGE_BAND.YOUTH,
    });
    expect(getRelationshipPortrait(RELATIONSHIP.NIECE, AGE_BAND.OLD_AGE)).toEqual({
      gender: GENDER.WOMAN,
      ageBand: AGE_BAND.YOUTH,
    });
  });

  it("shows adult parents for youth and elder parents for adulthood", () => {
    expect(getRelationshipPortrait(RELATIONSHIP.MOTHER, AGE_BAND.YOUTH).ageBand).toBe(
      AGE_BAND.ADULTHOOD,
    );
    expect(getRelationshipPortrait(RELATIONSHIP.MOTHER, AGE_BAND.ADULTHOOD).ageBand).toBe(
      AGE_BAND.OLD_AGE,
    );
  });
});
