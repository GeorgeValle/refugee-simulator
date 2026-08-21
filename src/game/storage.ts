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

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Persistence is best-effort; the current React session remains usable.
  }
}

function readSessions(): GameSession[] {
  try {
    const raw = localStorage.getItem(SAVES_KEY);
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

export const saveRepository = {
  list(): SaveSlot[] {
    const sessions = readSessions();
    return SAVE_SLOT_IDS.map((slotId) => ({
      slotId,
      session: sessions.find((session) => session.slotId === slotId) ?? null,
    }));
  },
  load(slotId: SaveSlotId): GameSession | null {
    return readSessions().find((session) => session.slotId === slotId) ?? null;
  },
  save(session: GameSession): void {
    const result = gameSessionSchema.safeParse(session);
    if (!result.success) return;
    const sessions = readSessions().filter((candidate) => candidate.slotId !== session.slotId);
    writeStorage(SAVES_KEY, JSON.stringify([...sessions, result.data]));
  },
  delete(slotId: SaveSlotId): void {
    const sessions = readSessions().filter((session) => session.slotId !== slotId);
    writeStorage(SAVES_KEY, JSON.stringify(sessions));
  },
};

export const preferencesRepository = {
  load(): AudioPreferences {
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY);
      if (!raw) return DEFAULT_AUDIO_PREFERENCES;
      const result = audioPreferencesSchema.safeParse(JSON.parse(raw) as unknown);
      return result.success ? result.data : DEFAULT_AUDIO_PREFERENCES;
    } catch {
      return DEFAULT_AUDIO_PREFERENCES;
    }
  },
  save(preferences: AudioPreferences): void {
    const result = audioPreferencesSchema.safeParse(preferences);
    if (result.success) writeStorage(PREFERENCES_KEY, JSON.stringify(result.data));
  },
};
