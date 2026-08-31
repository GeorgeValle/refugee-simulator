import { describe, expect, it } from "vitest";
import {
  AGE_BAND,
  canAddRelationship,
  getEligibleRelationships,
  RELATIONSHIP,
  usesSportSlip,
} from "@/game/model";

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

  it("uses nephews and nieces instead of parents or grandparents in old age", () => {
    const eligible = getEligibleRelationships(AGE_BAND.OLD_AGE);
    expect(eligible).toContain(RELATIONSHIP.NEPHEW);
    expect(eligible).toContain(RELATIONSHIP.NIECE);
    expect(eligible).not.toContain(RELATIONSHIP.FATHER);
    expect(eligible).not.toContain(RELATIONSHIP.MOTHER);
    expect(eligible).not.toContain(RELATIONSHIP.GRANDFATHER);
    expect(eligible).not.toContain(RELATIONSHIP.GRANDMOTHER);
  });

  it("removes aunts, uncles, and grandparents for adulthood", () => {
    const eligible = getEligibleRelationships(AGE_BAND.ADULTHOOD);
    expect(eligible).not.toContain(RELATIONSHIP.UNCLE);
    expect(eligible).not.toContain(RELATIONSHIP.AUNT);
    expect(eligible).not.toContain(RELATIONSHIP.GRANDFATHER);
    expect(eligible).not.toContain(RELATIONSHIP.GRANDMOTHER);
  });

  it("allows repeated children and siblings, but not singular relationships", () => {
    expect(canAddRelationship(RELATIONSHIP.DAUGHTER, [RELATIONSHIP.DAUGHTER])).toBe(true);
    expect(canAddRelationship(RELATIONSHIP.BROTHER, [RELATIONSHIP.BROTHER])).toBe(true);
    expect(canAddRelationship(RELATIONSHIP.NEPHEW, [RELATIONSHIP.NEPHEW])).toBe(true);
    expect(canAddRelationship(RELATIONSHIP.MOTHER, [RELATIONSHIP.MOTHER])).toBe(false);
    expect(canAddRelationship(RELATIONSHIP.WIFE, [RELATIONSHIP.WIFE])).toBe(false);
  });

  it("uses Sport only for childhood and adolescence", () => {
    expect(usesSportSlip(AGE_BAND.CHILDHOOD)).toBe(true);
    expect(usesSportSlip(AGE_BAND.ADOLESCENCE)).toBe(true);
    expect(usesSportSlip(AGE_BAND.YOUTH)).toBe(false);
    expect(usesSportSlip(AGE_BAND.ADULTHOOD)).toBe(false);
    expect(usesSportSlip(AGE_BAND.OLD_AGE)).toBe(false);
  });
});
