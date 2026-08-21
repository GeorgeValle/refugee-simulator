import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSession, DEFAULT_AUDIO_PREFERENCES, STORY_STEP } from "@/game/model";
import { preferencesRepository, saveRepository } from "@/game/storage";

describe("save repository", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("keeps three independent local slots", () => {
    const first = { ...createSession(1, 100), step: STORY_STEP.APARTMENT, updatedAt: 200 };
    const third = { ...createSession(3, 300), step: STORY_STEP.VILLAGE, updatedAt: 400 };
    saveRepository.save(first);
    saveRepository.save(third);

    const slots = saveRepository.list();
    expect(slots).toHaveLength(3);
    expect(slots[0]?.session?.step).toBe(STORY_STEP.APARTMENT);
    expect(slots[1]?.session).toBeNull();
    expect(slots[2]?.session?.step).toBe(STORY_STEP.VILLAGE);
  });

  it("ignores corrupt JSON and invalid sessions", () => {
    localStorage.setItem("refugee-simulator:saves:v1", "{broken");
    expect(saveRepository.list().every((slot) => slot.session === null)).toBe(true);

    localStorage.setItem(
      "refugee-simulator:saves:v1",
      JSON.stringify([{ schemaVersion: 999, slotId: 1 }, createSession(2, 500)]),
    );
    expect(saveRepository.load(1)).toBeNull();
    expect(saveRepository.load(2)?.slotId).toBe(2);
  });

  it("deletes only the requested slot", () => {
    saveRepository.save(createSession(1, 100));
    saveRepository.save(createSession(2, 200));
    saveRepository.delete(1);
    expect(saveRepository.load(1)).toBeNull();
    expect(saveRepository.load(2)).not.toBeNull();
  });

  it("round-trips a stable save from every story chapter", () => {
    for (const [index, step] of Object.values(STORY_STEP).entries()) {
      const session = {
        ...createSession(1, 1_000 + index),
        step,
        updatedAt: 2_000 + index,
      };
      saveRepository.save(session);
      expect(saveRepository.load(1)?.step).toBe(step);
    }
  });

  it("keeps repository writes safe when local storage fails", () => {
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(() => saveRepository.save(createSession(1, 100))).not.toThrow();
    expect(() => saveRepository.delete(1)).not.toThrow();
    expect(() => preferencesRepository.save(DEFAULT_AUDIO_PREFERENCES)).not.toThrow();
    expect(write).toHaveBeenCalledTimes(3);
  });
});
