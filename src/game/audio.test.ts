import { afterEach, describe, expect, it, vi } from "vitest";
import { ProceduralAudioDirector } from "@/game/audio";
import { DEFAULT_AUDIO_PREFERENCES } from "@/game/model";

class FakeAudioParam {
  value = 0;
  setTargetAtTime = vi.fn();
}

class FakeGainNode {
  gain = new FakeAudioParam();
  connect() {
    return this;
  }
}

class FakeOscillatorNode {
  type: OscillatorType = "sine";
  frequency = new FakeAudioParam();
  detune = new FakeAudioParam();
  start = vi.fn();
  stop = vi.fn();
  connect() {
    return this;
  }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: AudioContextState = "suspended";
  currentTime = 0;
  destination = {};
  oscillatorCount = 0;
  resume = vi.fn(async () => {
    this.state = "running";
  });
  suspend = vi.fn(async () => {
    this.state = "suspended";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createGain() {
    return new FakeGainNode();
  }

  createOscillator() {
    this.oscillatorCount += 1;
    return new FakeOscillatorNode();
  }
}

describe("ProceduralAudioDirector pause lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeAudioContext.instances = [];
  });

  it("creates one context and restarts a paused scene only once", async () => {
    vi.stubGlobal("AudioContext", FakeAudioContext as unknown as typeof AudioContext);
    const director = new ProceduralAudioDirector(DEFAULT_AUDIO_PREFERENCES);

    await director.unlock();
    const [context] = FakeAudioContext.instances;
    expect(context).toBeDefined();
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(context?.oscillatorCount).toBe(3);

    director.resume();
    expect(context?.oscillatorCount).toBe(3);

    director.pause();
    director.pause();
    expect(context?.suspend).toHaveBeenCalledOnce();

    director.resume();
    director.resume();
    await Promise.resolve();
    expect(context?.resume).toHaveBeenCalledTimes(2);
    expect(context?.oscillatorCount).toBe(6);

    director.destroy();
  });

  it("does not restart audio when another pause wins the resume race", async () => {
    vi.stubGlobal("AudioContext", FakeAudioContext as unknown as typeof AudioContext);
    const director = new ProceduralAudioDirector(DEFAULT_AUDIO_PREFERENCES);
    await director.unlock();
    const [context] = FakeAudioContext.instances;

    director.pause();
    director.resume();
    director.pause();
    await Promise.resolve();

    expect(context?.oscillatorCount).toBe(3);
    director.destroy();
  });
});
