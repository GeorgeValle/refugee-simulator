import type { AudioPreferences, StoryStep } from "@/game/model";
import { STORY_STEP } from "@/game/model";

type AudioScene = StoryStep | "menu";

export class ProceduralAudioDirector {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private activeNodes: AudioScheduledSourceNode[] = [];
  private timers: number[] = [];
  private scene: AudioScene = "menu";
  private preferences: AudioPreferences;
  private paused = false;

  constructor(preferences: AudioPreferences) {
    this.preferences = preferences;
  }

  async unlock(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
    }
    await this.context.resume();
    this.applyMasterVolume();
    this.startScene(this.scene);
  }

  setPreferences(preferences: AudioPreferences): void {
    const shouldRestart =
      this.preferences.music !== preferences.music || this.preferences.muted !== preferences.muted;
    this.preferences = preferences;
    this.applyMasterVolume();
    if (this.context && !this.paused && shouldRestart) {
      this.stopScene();
      this.startScene(this.scene);
    }
  }

  setScene(scene: AudioScene): void {
    if (scene === this.scene && this.activeNodes.length > 0) return;
    this.scene = scene;
    this.stopScene();
    if (this.context && !this.paused) this.startScene(scene);
  }

  pause(): void {
    this.paused = true;
    this.stopScene();
    if (this.context?.state === "running") void this.context.suspend();
  }

  resume(): void {
    this.paused = false;
    if (this.context) {
      void this.context.resume().then(() => this.startScene(this.scene));
    }
  }

  destroy(): void {
    this.stopScene();
    if (this.context) void this.context.close();
    this.context = null;
    this.master = null;
  }

  private applyMasterVolume(): void {
    if (!this.master || !this.context) return;
    const level = this.preferences.muted ? 0 : 0.75;
    this.master.gain.setTargetAtTime(level, this.context.currentTime, 0.08);
  }

  private startScene(scene: AudioScene): void {
    if (!this.context || !this.master || this.preferences.muted || this.paused) return;
    const tensionScenes: AudioScene[] = [
      STORY_STEP.APARTMENT,
      STORY_STEP.TELEVISION,
      STORY_STEP.FIRST_LOSS,
      STORY_STEP.VILLAGE,
      STORY_STEP.TIMED_LOSS,
      STORY_STEP.FOREST,
      STORY_STEP.ARMED_ENCOUNTER,
    ];
    const baseFrequency = tensionScenes.includes(scene) ? 73.42 : scene === "menu" ? 110 : 98;
    this.createPad(baseFrequency);

    if (scene === STORY_STEP.APARTMENT) {
      this.scheduleRepeating(() => this.playExplosion(), 6_500, 2_500);
    }
    if (scene === STORY_STEP.TIMED_LOSS) {
      this.scheduleRepeating(() => this.playTick(), 1_000, 250);
    }
    if (scene === STORY_STEP.JOURNEY) {
      this.scheduleRepeating(() => this.playFootstep(), 620, 200);
    }
    if (scene === STORY_STEP.ARMED_ENCOUNTER) {
      this.scheduleRepeating(() => this.playIndistinctVoice(), 2_800, 350);
    }
    if (scene === STORY_STEP.CAMP || scene === STORY_STEP.ENDING) {
      this.scheduleRepeating(() => this.playSoftSobbingTexture(), 7_000, 1_200);
    }
  }

  private createPad(frequency: number): void {
    if (!this.context || !this.master) return;
    const gain = this.context.createGain();
    gain.gain.value = this.preferences.music * 0.055;
    gain.connect(this.master);
    for (const ratio of [1, 1.5, 2]) {
      const oscillator = this.context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency * ratio;
      oscillator.detune.value = (ratio - 1.5) * 4;
      oscillator.connect(gain);
      oscillator.start();
      this.activeNodes.push(oscillator);
    }
  }

  private playExplosion(): void {
    this.playNoiseBurst(0.9, 85, this.preferences.effects * 0.22);
  }

  private playTick(): void {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(this.preferences.effects * 0.06, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.05);
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.06);
  }

  private playFootstep(): void {
    this.playNoiseBurst(0.08, 280, this.preferences.effects * 0.055);
  }

  private playIndistinctVoice(): void {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(118 + Math.random() * 35, this.context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(82, this.context.currentTime + 0.45);
    filter.type = "bandpass";
    filter.frequency.value = 540;
    filter.Q.value = 2.6;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(
      this.preferences.voices * 0.035,
      this.context.currentTime + 0.04,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.55);
    oscillator.connect(filter).connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.56);
  }

  private playSoftSobbingTexture(): void {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 210;
    lfo.frequency.value = 3.2;
    lfoGain.gain.value = 22;
    lfo.connect(lfoGain).connect(oscillator.frequency);
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(
      this.preferences.voices * 0.012,
      this.context.currentTime + 0.4,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 2.8);
    oscillator.connect(gain).connect(this.master);
    lfo.start();
    oscillator.start();
    lfo.stop(this.context.currentTime + 2.9);
    oscillator.stop(this.context.currentTime + 2.9);
  }

  private playNoiseBurst(duration: number, cutoff: number, volume: number): void {
    if (!this.context || !this.master) return;
    const length = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }

  private scheduleRepeating(callback: () => void, interval: number, initialDelay: number): void {
    const starter = window.setTimeout(() => {
      callback();
      const timer = window.setInterval(callback, interval);
      this.timers.push(timer);
    }, initialDelay);
    this.timers.push(starter);
  }

  private stopScene(): void {
    for (const timer of this.timers) window.clearInterval(timer);
    this.timers = [];
    for (const node of this.activeNodes) {
      try {
        node.stop();
      } catch {
        // The node may already be stopped by the browser.
      }
    }
    this.activeNodes = [];
  }
}
