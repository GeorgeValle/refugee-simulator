import {
  type AudioPreferences,
  DEFAULT_AUDIO_PREFERENCES,
  type GameSession,
  SAVE_SLOT_IDS,
  type SaveSlot,
  type SaveSlotId,
} from "@/game/model";
import { audioPreferencesSchema, gameSessionSchema } from "@/game/schema";

const SAVES_KEY = "refugee-simulator:saves:v1";
const PREFERENCES_KEY = "refugee-simulator:preferences:v1";

export const PERSISTENCE_RESULT = {
  PERSISTENT: "persistent",
  MEMORY: "memory",
  INVALID: "invalid",
} as const;

export type PersistenceResult = (typeof PERSISTENCE_RESULT)[keyof typeof PERSISTENCE_RESULT];

type StorageProvider = () => Storage;

function writeStorage(provider: StorageProvider, key: string, value: string): boolean {
  try {
    provider().setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readSessions(provider: StorageProvider): GameSession[] {
  try {
    const raw = provider().getItem(SAVES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((candidate) => {
      const result = gameSessionSchema.safeParse(candidate);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function createSaveRepository(provider: StorageProvider = () => localStorage) {
  let snapshot: GameSession[] | null = null;

  const sessions = () => {
    snapshot ??= readSessions(provider);
    return snapshot;
  };

  return {
    list(): SaveSlot[] {
      const current = sessions();
      return SAVE_SLOT_IDS.map((slotId) => ({
        slotId,
        session: current.find((session) => session.slotId === slotId) ?? null,
      }));
    },
    load(slotId: SaveSlotId): GameSession | null {
      return sessions().find((session) => session.slotId === slotId) ?? null;
    },
    save(session: GameSession): PersistenceResult {
      const result = gameSessionSchema.safeParse(session);
      if (!result.success) return PERSISTENCE_RESULT.INVALID;
      snapshot = [
        ...sessions().filter((candidate) => candidate.slotId !== result.data.slotId),
        result.data,
      ];
      return writeStorage(provider, SAVES_KEY, JSON.stringify(snapshot))
        ? PERSISTENCE_RESULT.PERSISTENT
        : PERSISTENCE_RESULT.MEMORY;
    },
    delete(slotId: SaveSlotId): PersistenceResult {
      snapshot = sessions().filter((session) => session.slotId !== slotId);
      return writeStorage(provider, SAVES_KEY, JSON.stringify(snapshot))
        ? PERSISTENCE_RESULT.PERSISTENT
        : PERSISTENCE_RESULT.MEMORY;
    },
  };
}

export function createPreferencesRepository(provider: StorageProvider = () => localStorage) {
  let snapshot: AudioPreferences | null = null;

  return {
    load(): AudioPreferences {
      if (snapshot) return snapshot;
      try {
        const raw = provider().getItem(PREFERENCES_KEY);
        if (!raw) {
          snapshot = DEFAULT_AUDIO_PREFERENCES;
          return snapshot;
        }
        const result = audioPreferencesSchema.safeParse(JSON.parse(raw) as unknown);
        snapshot = result.success ? result.data : DEFAULT_AUDIO_PREFERENCES;
        return snapshot;
      } catch {
        snapshot = DEFAULT_AUDIO_PREFERENCES;
        return snapshot;
      }
    },
    save(preferences: AudioPreferences): PersistenceResult {
      const result = audioPreferencesSchema.safeParse(preferences);
      if (!result.success) return PERSISTENCE_RESULT.INVALID;
      snapshot = result.data;
      return writeStorage(provider, PREFERENCES_KEY, JSON.stringify(snapshot))
        ? PERSISTENCE_RESULT.PERSISTENT
        : PERSISTENCE_RESULT.MEMORY;
    },
  };
}

export const saveRepository = createSaveRepository();
export const preferencesRepository = createPreferencesRepository();
