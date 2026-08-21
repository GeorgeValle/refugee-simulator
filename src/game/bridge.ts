import type { AudioPreferences, CharacterProfile, FamilyMember, StoryStep } from "@/game/model";

export interface VisualCommand {
  step: StoryStep | "menu";
  profile: CharacterProfile | null;
  family: FamilyMember[];
  reducedMotion: boolean;
}

interface BridgeEvents {
  visual: VisualCommand;
  pause: boolean;
  preferences: AudioPreferences;
  unlockAudio: undefined;
}

type BridgeEventName = keyof BridgeEvents;
type Listener<T> = (payload: T) => void;

class GameBridge {
  private listeners = new Map<BridgeEventName, Set<Listener<never>>>();
  private latestVisual: VisualCommand | null = null;
  private latestPreferences: AudioPreferences | null = null;
  private latestPause = false;

  emit<K extends BridgeEventName>(name: K, payload: BridgeEvents[K]): void {
    if (name === "visual") this.latestVisual = payload as VisualCommand;
    if (name === "preferences") this.latestPreferences = payload as AudioPreferences;
    if (name === "pause") this.latestPause = payload as boolean;
    for (const listener of this.listeners.get(name) ?? []) {
      (listener as Listener<BridgeEvents[K]>)(payload);
    }
  }

  on<K extends BridgeEventName>(name: K, listener: Listener<BridgeEvents[K]>): () => void {
    const listeners = this.listeners.get(name) ?? new Set<Listener<never>>();
    listeners.add(listener as Listener<never>);
    this.listeners.set(name, listeners);
    if (name === "visual" && this.latestVisual) {
      listener(this.latestVisual as BridgeEvents[K]);
    }
    if (name === "preferences" && this.latestPreferences) {
      listener(this.latestPreferences as BridgeEvents[K]);
    }
    if (name === "pause") {
      listener(this.latestPause as BridgeEvents[K]);
    }
    return () => listeners.delete(listener as Listener<never>);
  }
}

export const gameBridge = new GameBridge();
