import { describe, expect, it } from "vitest";
import { AGE_BAND, canAddRelationship, getEligibleRelationships, RELATIONSHIP } from "@/game/model";

describe("family relationship rules", () => {
  it("does not offer partners or children during childhood and adolescence", () => {
    for (const ageBand of [AGE_BAND.CHILDHOOD, AGE_BAND.ADOLESCENCE]) {
      const eligible = getEligibleRelationships(ageBand);
      expect(eligible).not.toContain(RELATIONSHIP.DAUGHTER);
      expect(eligible).not.toContain(RELATIONSHIP.SON);
      expect(eligible).not.toContain(RELATIONSHIP.WIFE);
      expect(eligible).not.toContain(RELATIONSHIP.HUSBAND);
    }
  });

  it("offers partners and children from youth onward", () => {
    const eligible = getEligibleRelationships(AGE_BAND.YOUTH);
    expect(eligible).toEqual(
      expect.arrayContaining([
        RELATIONSHIP.DAUGHTER,
        RELATIONSHIP.SON,
        RELATIONSHIP.WIFE,
        RELATIONSHIP.HUSBAND,
      ]),
    );
  });

  it("does not offer grandparents in old age", () => {
    const eligible = getEligibleRelationships(AGE_BAND.OLD_AGE);
    expect(eligible).not.toContain(RELATIONSHIP.GRANDFATHER);
    expect(eligible).not.toContain(RELATIONSHIP.GRANDMOTHER);
  });

  it("allows repeated children and siblings, but not singular relationships", () => {
    expect(canAddRelationship(RELATIONSHIP.DAUGHTER, [RELATIONSHIP.DAUGHTER])).toBe(true);
    expect(canAddRelationship(RELATIONSHIP.BROTHER, [RELATIONSHIP.BROTHER])).toBe(true);
    expect(canAddRelationship(RELATIONSHIP.MOTHER, [RELATIONSHIP.MOTHER])).toBe(false);
    expect(canAddRelationship(RELATIONSHIP.WIFE, [RELATIONSHIP.WIFE])).toBe(false);
  });
});
