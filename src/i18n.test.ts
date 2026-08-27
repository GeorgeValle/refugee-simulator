import { describe, expect, it } from "vitest";
import { AGE_BAND, GENDER, LOSS_CAUSE, RELATIONSHIP, SLIP_KIND, STORY_STEP } from "@/game/model";
import { UNLOCKABLE_IDS } from "@/game/unlockables";
import esAR from "@/locales/es-AR/translation.json";

describe("es-AR resources", () => {
  it("contains labels for every value used by the typed game model", () => {
    for (const value of Object.values(GENDER)) expect(esAR.gender[value]).toBeTruthy();
    for (const value of Object.values(AGE_BAND)) expect(esAR.age[value]).toBeTruthy();
    for (const value of Object.values(RELATIONSHIP)) expect(esAR.relationship[value]).toBeTruthy();
    for (const value of Object.values(STORY_STEP)) expect(esAR.chapters[value]).toBeTruthy();
    for (const value of Object.values(LOSS_CAUSE)) expect(esAR.loss[value]).toBeTruthy();
    for (const value of Object.values(SLIP_KIND)) expect(esAR.slips[value]).toBeTruthy();
    for (const value of UNLOCKABLE_IDS) {
      expect(esAR.unlockables.cards[value].title).toBeTruthy();
      expect(esAR.unlockables.cards[value].condition).toBeTruthy();
    }
    for (const value of Object.values(AGE_BAND)) {
      expect(esAR.ending.personalized.age[value]).toBeTruthy();
    }
  });
});
