import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSession, DEFAULT_AUDIO_PREFERENCES, STORY_STEP } from "@/game/model";
import {
  createPreferencesRepository,
  createSaveRepository,
  createUnlockablesRepository,
  PERSISTENCE_RESULT,
} from "@/game/storage";
import { UNLOCKABLE_ID } from "@/game/unlockables";
import { createStorySession, createStorySessions } from "@/test/storyFixtures";

describe("save repository", () => {
  let repository: ReturnType<typeof createSaveRepository>;
  let preferences: ReturnType<typeof createPreferencesRepository>;

  beforeEach(() => {
    localStorage.clear();
    repository = createSaveRepository();
    preferences = createPreferencesRepository();
  });
  afterEach(() => vi.restoreAllMocks());

  it("keeps three independent local slots", () => {
    const first = createStorySession(STORY_STEP.APARTMENT, 1);
    const third = createStorySession(STORY_STEP.VILLAGE, 3);
    expect(repository.save(first)).toBe(PERSISTENCE_RESULT.PERSISTENT);
    expect(repository.save(third)).toBe(PERSISTENCE_RESULT.PERSISTENT);

    const slots = repository.list();
    expect(slots).toHaveLength(3);
    expect(slots[0]?.session?.step).toBe(STORY_STEP.APARTMENT);
    expect(slots[1]?.session).toBeNull();
    expect(slots[2]?.session?.step).toBe(STORY_STEP.VILLAGE);
  });

  it("merges different slots saved by repositories from separate tabs", () => {
    const firstTab = createSaveRepository();
    const secondTab = createSaveRepository();
    firstTab.list();
    secondTab.list();

    expect(firstTab.save(createStorySession(STORY_STEP.APARTMENT, 1))).toBe(
      PERSISTENCE_RESULT.PERSISTENT,
    );
    expect(secondTab.save(createStorySession(STORY_STEP.VILLAGE, 2))).toBe(
      PERSISTENCE_RESULT.PERSISTENT,
    );

    const persisted = createSaveRepository();
    expect(persisted.load(1)?.step).toBe(STORY_STEP.APARTMENT);
    expect(persisted.load(2)?.step).toBe(STORY_STEP.VILLAGE);
  });

  it("uses the last mutation when separate tabs update the same slot", () => {
    const firstTab = createSaveRepository();
    const secondTab = createSaveRepository();
    firstTab.list();
    secondTab.list();

    firstTab.save(createStorySession(STORY_STEP.APARTMENT, 1));
    secondTab.save(createStorySession(STORY_STEP.TELEVISION, 1));

    expect(createSaveRepository().load(1)?.step).toBe(STORY_STEP.TELEVISION);
  });

  it("preserves another tab's slot when deleting from a stale repository", () => {
    const seed = createSaveRepository();
    seed.save(createStorySession(STORY_STEP.APARTMENT, 2));
    const deletingTab = createSaveRepository();
    const writingTab = createSaveRepository();
    deletingTab.list();
    writingTab.list();

    writingTab.save(createStorySession(STORY_STEP.VILLAGE, 1));
    expect(deletingTab.delete(2)).toBe(PERSISTENCE_RESULT.PERSISTENT);

    const persisted = createSaveRepository();
    expect(persisted.load(1)?.step).toBe(STORY_STEP.VILLAGE);
    expect(persisted.load(2)).toBeNull();
  });

  it("ignores corrupt JSON and invalid sessions", () => {
    localStorage.setItem("refugee-simulator:saves:v1", "{broken");
    expect(repository.list().every((slot) => slot.session === null)).toBe(true);

    localStorage.setItem(
      "refugee-simulator:saves:v1",
      JSON.stringify([{ schemaVersion: 999, slotId: 1 }, createSession(2, 500)]),
    );
    repository = createSaveRepository();
    expect(repository.load(1)).toBeNull();
    expect(repository.load(2)?.slotId).toBe(2);
  });

  it("replaces corrupt persisted data with the next valid save", () => {
    localStorage.setItem("refugee-simulator:saves:v1", "{broken");
    const apartment = createStorySession(STORY_STEP.APARTMENT, 1);

    expect(repository.save(apartment)).toBe(PERSISTENCE_RESULT.PERSISTENT);
    expect(createSaveRepository().load(1)?.step).toBe(STORY_STEP.APARTMENT);
  });

  it("deletes only the requested slot", () => {
    repository.save(createSession(1, 100));
    repository.save(createSession(2, 200));
    expect(repository.delete(1)).toBe(PERSISTENCE_RESULT.PERSISTENT);
    expect(repository.load(1)).toBeNull();
    expect(repository.load(2)).not.toBeNull();
  });

  it("round-trips a stable save built by the reducer from every story chapter", () => {
    for (const session of createStorySessions()) {
      expect(repository.save(session)).toBe(PERSISTENCE_RESULT.PERSISTENT);
      expect(repository.load(1)?.step).toBe(session.step);
    }
  });

  it("keeps saves, overwrites, preferences, and deletes coherent in memory mode", () => {
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    const apartment = createStorySession(STORY_STEP.APARTMENT);
    const television = createStorySession(STORY_STEP.TELEVISION);

    expect(repository.save(apartment)).toBe(PERSISTENCE_RESULT.MEMORY);
    expect(repository.load(1)?.step).toBe(STORY_STEP.APARTMENT);
    expect(repository.save(television)).toBe(PERSISTENCE_RESULT.MEMORY);
    expect(repository.load(1)?.step).toBe(STORY_STEP.TELEVISION);
    expect(preferences.save({ ...DEFAULT_AUDIO_PREFERENCES, muted: true })).toBe(
      PERSISTENCE_RESULT.MEMORY,
    );
    expect(preferences.load().muted).toBe(true);
    expect(repository.delete(1)).toBe(PERSISTENCE_RESULT.MEMORY);
    expect(repository.load(1)).toBeNull();
    expect(write).toHaveBeenCalledTimes(4);
  });

  it("returns to persistent mode after a later write succeeds", () => {
    const nativeSetItem = Storage.prototype.setItem;
    let unavailable = true;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(
      this: Storage,
      key,
      value,
    ) {
      if (unavailable) throw new DOMException("Quota exceeded", "QuotaExceededError");
      nativeSetItem.call(this, key, value);
    });

    expect(repository.save(createStorySession(STORY_STEP.APARTMENT))).toBe(
      PERSISTENCE_RESULT.MEMORY,
    );
    unavailable = false;
    expect(repository.save(createStorySession(STORY_STEP.TELEVISION))).toBe(
      PERSISTENCE_RESULT.PERSISTENT,
    );
    expect(createSaveRepository().load(1)?.step).toBe(STORY_STEP.TELEVISION);
  });

  it("merges volatile mutations with other-tab saves when storage recovers", () => {
    const nativeSetItem = Storage.prototype.setItem;
    let unavailable = true;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(
      this: Storage,
      key,
      value,
    ) {
      if (unavailable) throw new DOMException("Quota exceeded", "QuotaExceededError");
      nativeSetItem.call(this, key, value);
    });
    const volatile = createStorySession(STORY_STEP.APARTMENT, 1);
    const external = createStorySession(STORY_STEP.TELEVISION, 2);
    const recovered = createStorySession(STORY_STEP.VILLAGE, 3);

    expect(repository.save(volatile)).toBe(PERSISTENCE_RESULT.MEMORY);
    nativeSetItem.call(localStorage, "refugee-simulator:saves:v1", JSON.stringify([external]));
    unavailable = false;
    expect(repository.save(recovered)).toBe(PERSISTENCE_RESULT.PERSISTENT);

    const persisted = createSaveRepository();
    expect(persisted.load(1)?.step).toBe(STORY_STEP.APARTMENT);
    expect(persisted.load(2)?.step).toBe(STORY_STEP.TELEVISION);
    expect(persisted.load(3)?.step).toBe(STORY_STEP.VILLAGE);
  });

  it("rejects invalid mutations without replacing its snapshot", () => {
    const apartment = createStorySession(STORY_STEP.APARTMENT);
    expect(repository.save(apartment)).toBe(PERSISTENCE_RESULT.PERSISTENT);

    expect(repository.save({ ...apartment, profile: null })).toBe(PERSISTENCE_RESULT.INVALID);
    expect(repository.load(1)).toEqual(apartment);
  });
});

describe("unlockables repository", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("persists progress independently from save slot deletion", () => {
    const unlockables = createUnlockablesRepository();
    const saves = createSaveRepository();
    saves.save(createStorySession(STORY_STEP.ENDING));
    expect(unlockables.record([{ id: UNLOCKABLE_ID.YOUTH_ARRIVAL, unlockedAt: 2_500 }])).toBe(
      PERSISTENCE_RESULT.PERSISTENT,
    );

    saves.delete(1);

    expect(createUnlockablesRepository().list().entries).toContainEqual({
      id: UNLOCKABLE_ID.YOUTH_ARRIVAL,
      unlockedAt: 2_500,
    });
  });

  it("merges unlocks recorded by separate tabs and keeps the earliest timestamp", () => {
    const firstTab = createUnlockablesRepository();
    const secondTab = createUnlockablesRepository();
    firstTab.list();
    secondTab.list();

    firstTab.record([{ id: UNLOCKABLE_ID.DREAM_REMAINS, unlockedAt: 4_000 }]);
    secondTab.record([
      { id: UNLOCKABLE_ID.PROFESSION_REMAINS, unlockedAt: 4_100 },
      { id: UNLOCKABLE_ID.DREAM_REMAINS, unlockedAt: 3_900 },
    ]);

    expect(createUnlockablesRepository().list().entries).toEqual([
      { id: UNLOCKABLE_ID.DREAM_REMAINS, unlockedAt: 3_900 },
      { id: UNLOCKABLE_ID.PROFESSION_REMAINS, unlockedAt: 4_100 },
    ]);
  });

  it("ignores corrupt data and replaces it with the next valid record", () => {
    localStorage.setItem("refugee-simulator:unlockables:v1", "{broken");
    const repository = createUnlockablesRepository();
    expect(repository.list().entries).toEqual([]);

    expect(repository.record([{ id: UNLOCKABLE_ID.CHILDHOOD_ARRIVAL, unlockedAt: 1_000 }])).toBe(
      PERSISTENCE_RESULT.PERSISTENT,
    );
    expect(createUnlockablesRepository().list().entries).toHaveLength(1);
  });

  it("keeps unlocks in memory and flushes them when storage recovers", () => {
    const nativeSetItem = Storage.prototype.setItem;
    let unavailable = true;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(
      this: Storage,
      key,
      value,
    ) {
      if (unavailable) throw new DOMException("Quota exceeded", "QuotaExceededError");
      nativeSetItem.call(this, key, value);
    });
    const repository = createUnlockablesRepository();
    const first = { id: UNLOCKABLE_ID.ADOLESCENCE_ARRIVAL, unlockedAt: 1_000 } as const;
    const second = { id: UNLOCKABLE_ID.DREAM_REMAINS, unlockedAt: 2_000 } as const;

    expect(repository.record([first])).toBe(PERSISTENCE_RESULT.MEMORY);
    expect(repository.list().entries).toContainEqual(first);
    unavailable = false;
    expect(repository.record([second])).toBe(PERSISTENCE_RESULT.PERSISTENT);
    expect(createUnlockablesRepository().list().entries).toEqual([first, second]);
  });

  it("rejects duplicate IDs without replacing persisted progress", () => {
    const repository = createUnlockablesRepository();
    const original = { id: UNLOCKABLE_ID.OLD_AGE_ARRIVAL, unlockedAt: 1_000 } as const;
    repository.record([original]);

    expect(repository.record([original, { ...original, unlockedAt: 2_000 }])).toBe(
      PERSISTENCE_RESULT.INVALID,
    );
    expect(repository.list().entries).toEqual([original]);
  });
});
