import Phaser from "phaser";
import { ProceduralAudioDirector } from "@/game/audio";
import { gameBridge, type VisualCommand } from "@/game/bridge";
import { DEFAULT_AUDIO_PREFERENCES, STORY_STEP } from "@/game/model";
import { getRelationshipPortrait } from "@/game/portraits";

const BACKGROUND_BY_STEP: Record<VisualCommand["step"], string> = {
  menu: "menu-city",
  [STORY_STEP.CREATE_PROFILE]: "menu-city",
  [STORY_STEP.APARTMENT]: "apartment",
  [STORY_STEP.TELEVISION]: "television",
  [STORY_STEP.FAMILY]: "apartment",
  [STORY_STEP.PACKING]: "apartment",
  [STORY_STEP.FIRST_LOSS]: "apartment",
  [STORY_STEP.VILLAGE]: "village",
  [STORY_STEP.TIMED_LOSS]: "village",
  [STORY_STEP.JOURNEY]: "journey",
  [STORY_STEP.FOREST]: "forest",
  [STORY_STEP.ARMED_ENCOUNTER]: "forest",
  [STORY_STEP.CAMP]: "camp",
  [STORY_STEP.ENDING]: "camp",
};

const ART_ASSET_BASE = `${import.meta.env.BASE_URL}assets/art/`;

const BACKGROUND_ASSETS = {
  "menu-city": `${ART_ASSET_BASE}menu-city.webp`,
  apartment: `${ART_ASSET_BASE}apartment.webp`,
  television: `${ART_ASSET_BASE}television.webp`,
  village: `${ART_ASSET_BASE}village.webp`,
  journey: `${ART_ASSET_BASE}journey.webp`,
  forest: `${ART_ASSET_BASE}forest.webp`,
  camp: `${ART_ASSET_BASE}camp.webp`,
} as const;

export class NarrativeScene extends Phaser.Scene {
  private background: Phaser.GameObjects.Image | null = null;
  private foregrounds: Phaser.GameObjects.Image[] = [];
  private ambience: Phaser.GameObjects.Container | null = null;
  private ambienceEvent: Phaser.Time.TimerEvent | null = null;
  private currentVisual: VisualCommand | null = null;
  private audioDirector = new ProceduralAudioDirector(DEFAULT_AUDIO_PREFERENCES);
  private unsubscribers: Array<() => void> = [];

  constructor() {
    super("NarrativeScene");
  }

  preload(): void {
    for (const [key, url] of Object.entries(BACKGROUND_ASSETS)) this.load.image(key, url);
    this.load.image("neighbor", `${ART_ASSET_BASE}neighbor.png`);
    this.load.image("armed-group", `${ART_ASSET_BASE}armed-group.png`);
    for (const gender of ["man", "woman"] as const) {
      for (const age of ["childhood", "adolescence", "youth", "adulthood", "oldAge"] as const) {
        this.load.image(
          `protagonist-${gender}-${age}`,
          `${ART_ASSET_BASE}protagonist-${gender}-${age}.png`,
        );
      }
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#080f1e");
    this.unsubscribers = [
      gameBridge.on("visual", (visual) => this.renderVisual(visual)),
      gameBridge.on("pause", (paused) => {
        if (paused) {
          this.scene.pause();
          this.audioDirector.pause();
        } else {
          this.scene.resume();
          this.audioDirector.resume();
        }
      }),
      gameBridge.on("preferences", (preferences) => this.audioDirector.setPreferences(preferences)),
      gameBridge.on("unlockAudio", () => void this.audioDirector.unlock()),
    ];
    this.scale.on("resize", () => this.layout());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroyScene());
  }

  private renderVisual(visual: VisualCommand): void {
    const previousKey = this.currentVisual ? BACKGROUND_BY_STEP[this.currentVisual.step] : null;
    const nextKey = BACKGROUND_BY_STEP[visual.step];
    this.currentVisual = visual;
    this.audioDirector.setScene(visual.step);

    if (previousKey !== nextKey || !this.background) {
      this.background?.destroy();
      this.background = this.add.image(0, 0, nextKey).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: this.background,
        alpha: 1,
        duration: visual.reducedMotion ? 0 : 700,
        ease: "Sine.Out",
      });
    }
    this.renderForeground(visual);
    this.renderAmbience(visual);
    this.layout();
  }

  private renderForeground(visual: VisualCommand): void {
    for (const image of this.foregrounds) image.destroy();
    this.foregrounds = [];
    if (visual.step === STORY_STEP.APARTMENT && visual.profile) {
      const key = `protagonist-${visual.profile.gender}-${visual.profile.ageBand}`;
      if (this.textures.exists(key)) {
        this.foregrounds.push(this.add.image(0, 0, key).setOrigin(0.5, 1).setDepth(3));
      }
    }
    if (
      visual.family.length > 0 &&
      new Set<VisualCommand["step"]>([
        STORY_STEP.FAMILY,
        STORY_STEP.PACKING,
        STORY_STEP.FIRST_LOSS,
      ]).has(visual.step)
    ) {
      for (const member of visual.family) {
        const portrait = getRelationshipPortrait(member.relationship);
        const key = `protagonist-${portrait.gender}-${portrait.ageBand}`;
        if (this.textures.exists(key)) {
          this.foregrounds.push(this.add.image(0, 0, key).setOrigin(0.5, 1).setDepth(3));
        }
      }
    }
    if (visual.step === STORY_STEP.VILLAGE || visual.step === STORY_STEP.TIMED_LOSS) {
      if (this.textures.exists("neighbor")) {
        this.foregrounds.push(this.add.image(0, 0, "neighbor").setOrigin(0.5, 1).setDepth(3));
      }
    }
    if (visual.step === STORY_STEP.ARMED_ENCOUNTER && this.textures.exists("armed-group")) {
      this.foregrounds.push(this.add.image(0, 0, "armed-group").setOrigin(0.5, 1).setDepth(4));
    }
  }

  private renderAmbience(visual: VisualCommand): void {
    this.ambienceEvent?.remove(false);
    this.ambienceEvent = null;
    this.ambience?.destroy(true);
    this.ambience = this.add.container(0, 0).setDepth(2);
    if (visual.reducedMotion) return;
    if (visual.step === STORY_STEP.APARTMENT) {
      const flash = this.add.rectangle(0, 0, 10, 10, 0xe7d7ad, 0).setOrigin(0);
      this.ambience.add(flash);
      this.ambienceEvent = this.time.addEvent({
        delay: 6_500,
        loop: true,
        callback: () => {
          if (!flash.active) return;
          this.tweens.add({ targets: flash, alpha: 0.18, yoyo: true, duration: 140 });
        },
      });
    }
    if (visual.step === STORY_STEP.TELEVISION) {
      for (let index = 0; index < 18; index += 1) {
        const line = this.add.rectangle(0, index * 42, 10, 1, 0xc5f5ff, 0.14).setOrigin(0);
        this.ambience.add(line);
      }
    }
  }

  private layout(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    if (this.background) {
      const texture = this.background.texture.getSourceImage() as HTMLImageElement;
      const sourceWidth = texture.width || 1600;
      const sourceHeight = texture.height || 900;
      const scale = Math.max(width / sourceWidth, height / sourceHeight);
      this.background.setPosition(width / 2, height / 2).setScale(scale);
    }
    for (const [index, foreground] of this.foregrounds.entries()) {
      const texture = foreground.texture.getSourceImage() as HTMLImageElement;
      const isFamilyGroup =
        this.foregrounds.length > 1 && this.currentVisual?.step !== STORY_STEP.ARMED_ENCOUNTER;
      const targetHeight = height * (isFamilyGroup ? 0.5 : 0.84);
      const scale = Math.min(
        targetHeight / (texture.height || 900),
        width / (texture.width || 600),
      );
      const x = isFamilyGroup ? width * (0.54 + index * 0.115) : width * 0.72;
      foreground.setPosition(x, height * 1.02).setScale(scale);
    }
    if (this.ambience) {
      for (const child of this.ambience.list) {
        if (child instanceof Phaser.GameObjects.Rectangle)
          child.setSize(width, child.height || height);
      }
    }
  }

  private destroyScene(): void {
    this.ambienceEvent?.remove(false);
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
    this.audioDirector.destroy();
  }
}
