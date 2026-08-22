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

interface SessionsReadResult {
  sessions: GameSession[];
  available: boolean;
}

function writeStorage(provider: StorageProvider, key: string, value: string): boolean {
  try {
    provider().setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readSessions(provider: StorageProvider): SessionsReadResult {
  let raw: string | null;
  try {
    raw = provider().getItem(SAVES_KEY);
  } catch {
    return { sessions: [], available: false };
  }
  if (!raw) return { sessions: [], available: true };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { sessions: [], available: true };
  }
  if (!Array.isArray(parsed)) return { sessions: [], available: true };
  return {
    sessions: parsed.flatMap((candidate) => {
      const result = gameSessionSchema.safeParse(candidate);
      return result.success ? [result.data] : [];
    }),
    available: true,
  };
}

function applySessionMutations(
  sessions: GameSession[],
  mutations: ReadonlyMap<SaveSlotId, GameSession | null>,
): GameSession[] {
  const bySlot = new Map(sessions.map((session) => [session.slotId, session]));
  for (const [slotId, session] of mutations) {
    if (session) bySlot.set(slotId, session);
    else bySlot.delete(slotId);
  }
  return SAVE_SLOT_IDS.flatMap((slotId) => {
    const session = bySlot.get(slotId);
    return session ? [session] : [];
  });
}

export function createSaveRepository(provider: StorageProvider = () => localStorage) {
  let snapshot: GameSession[] | null = null;
  const pendingMutations = new Map<SaveSlotId, GameSession | null>();

  const sessions = () => {
    const persisted = readSessions(provider);
    if (persisted.available) {
      snapshot = applySessionMutations(persisted.sessions, pendingMutations);
    } else {
      snapshot = applySessionMutations(snapshot ?? [], pendingMutations);
    }
    return snapshot;
  };

  const persistMutation = (slotId: SaveSlotId, session: GameSession | null): PersistenceResult => {
    pendingMutations.set(slotId, session);
    const persisted = readSessions(provider);
    snapshot = applySessionMutations(
      persisted.available ? persisted.sessions : (snapshot ?? []),
      pendingMutations,
    );
    if (!persisted.available || !writeStorage(provider, SAVES_KEY, JSON.stringify(snapshot))) {
      return PERSISTENCE_RESULT.MEMORY;
    }
    pendingMutations.clear();
    return PERSISTENCE_RESULT.PERSISTENT;
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
      return persistMutation(result.data.slotId, result.data);
    },
    delete(slotId: SaveSlotId): PersistenceResult {
      return persistMutation(slotId, null);
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
