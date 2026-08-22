import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DialogueBox } from "@/components/DialogueBox";
import { Modal } from "@/components/Modal";
import { OrientationGuard } from "@/components/OrientationGuard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { gameBridge } from "@/game/bridge";
import {
  type AudioPreferences,
  type CharacterProfile,
  createSession,
  type FamilyMember,
  type GameSession,
  LOSS_CAUSE,
  type SaveSlot,
  type SaveSlotId,
  STORY_STEP,
  type StoryStep,
} from "@/game/model";
import { GAME_EVENT, type GameEvent, gameReducer } from "@/game/reducer";
import { preferencesRepository, saveRepository } from "@/game/storage";
import { usePortraitPhone } from "@/hooks/usePortraitPhone";
import { useSystemReducedMotion } from "@/hooks/useSystemReducedMotion";
import { EndingScreen } from "@/screens/EndingScreen";
import { FamilyScreen } from "@/screens/FamilyScreen";
import { LossScreen } from "@/screens/LossScreen";
import { MenuScreen } from "@/screens/MenuScreen";
import { PackingScreen } from "@/screens/PackingScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";

interface ConfirmAction {
  kind: "overwrite" | "delete";
  slotId: SaveSlotId;
}

const EMPTY_FAMILY: FamilyMember[] = [];
const WARNING_ACCEPTED_KEY = "refugee-simulator:warning-accepted";
const PhaserStage = lazy(async () => {
  const module = await import("@/game/PhaserStage");
  return { default: module.PhaserStage };
});

function loadWarningAccepted(): boolean {
  try {
    return window.sessionStorage.getItem(WARNING_ACCEPTED_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberWarningAccepted(): void {
  try {
    window.sessionStorage.setItem(WARNING_ACCEPTED_KEY, "true");
  } catch {
    // The in-memory React state still allows the user to continue.
  }
}

function storyScene(step: StoryStep): StoryStep {
  return step;
}

export default function App() {
  const { t } = useTranslation();
  const [warningAccepted, setWarningAccepted] = useState(loadWarningAccepted);
  const [slots, setSlots] = useState<SaveSlot[]>(() => saveRepository.list());
  const [session, setSession] = useState<GameSession | null>(null);
  const [preferences, setPreferences] = useState<AudioPreferences>(() =>
    preferencesRepository.load(),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const portraitPhone = usePortraitPhone();
  const gameplayPaused = portraitPhone || settingsOpen;
  const systemReducedMotion = useSystemReducedMotion();
  const reducedMotion = preferences.reducedMotion || systemReducedMotion;
  const audioUnlockedRef = useRef(false);
  const visualStep = session?.step ?? "menu";
  const visualProfile = session?.profile ?? null;
  const visualFamily = session?.family ?? EMPTY_FAMILY;
  const timerStep = session?.step ?? null;
  const timerDeadline = session?.timerDeadline ?? null;
  const timerRemainingMs = session?.timerRemainingMs ?? null;

  const refreshSlots = () => setSlots(saveRepository.list());
  const dispatchGame = (event: GameEvent) => {
    setSession((current) => (current ? gameReducer(current, event) : current));
  };
  const dispatchMany = (...events: GameEvent[]) => {
    setSession((current) =>
      current ? events.reduce((next, event) => gameReducer(next, event), current) : current,
    );
  };

  useEffect(() => {
    if (!session) return;
    saveRepository.save(session);
    setSlots(saveRepository.list());
  }, [session]);

  useEffect(() => {
    preferencesRepository.save(preferences);
    gameBridge.emit("preferences", preferences);
  }, [preferences]);

  useEffect(() => {
    gameBridge.emit("visual", {
      step: visualStep === "menu" ? "menu" : storyScene(visualStep),
      profile: visualProfile,
      family: visualFamily,
      reducedMotion,
    });
  }, [reducedMotion, visualFamily, visualProfile, visualStep]);

  useEffect(() => {
    gameBridge.emit("pause", gameplayPaused);
  }, [gameplayPaused]);

  useEffect(() => {
    if (timerStep !== STORY_STEP.TIMED_LOSS) return;
    if (gameplayPaused && timerDeadline !== null) {
      setSession((current) =>
        current ? gameReducer(current, { type: GAME_EVENT.PAUSE_TIMER }) : current,
      );
    } else if (!gameplayPaused && timerRemainingMs !== null) {
      setSession((current) =>
        current ? gameReducer(current, { type: GAME_EVENT.RESUME_TIMER }) : current,
      );
    }
  }, [gameplayPaused, timerDeadline, timerRemainingMs, timerStep]);

  useEffect(() => {
    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      gameBridge.emit("unlockAudio", undefined);
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const beginNew = (slotId: SaveSlotId) => {
    const occupied = slots.some((slot) => slot.slotId === slotId && slot.session);
    if (occupied) {
      setConfirmAction({ kind: "overwrite", slotId });
      return;
    }
    setSession(createSession(slotId));
  };

  const confirmPendingAction = () => {
    if (!confirmAction) return;
    if (confirmAction.kind === "delete") {
      saveRepository.delete(confirmAction.slotId);
      if (session?.slotId === confirmAction.slotId) setSession(null);
      refreshSlots();
    } else {
      const next = createSession(confirmAction.slotId);
      saveRepository.save(next);
      setSession(next);
    }
    setConfirmAction(null);
  };

  const continueSlot = (slotId: SaveSlotId) => {
    const saved = saveRepository.load(slotId);
    if (saved) setSession(saved);
  };

  const submitProfile = (profile: CharacterProfile) => {
    dispatchGame({ type: GAME_EVENT.SET_PROFILE, profile });
  };

  const submitFamily = (family: FamilyMember[]) => {
    dispatchGame({ type: GAME_EVENT.SET_FAMILY, family });
  };

  const goTo = (step: StoryStep) => dispatchGame({ type: GAME_EVENT.GO_TO, step });

  const renderStory = () => {
    if (!session) {
      return (
        <MenuScreen
          slots={slots}
          onNew={beginNew}
          onContinue={continueSlot}
          onDelete={(slotId) => setConfirmAction({ kind: "delete", slotId })}
        />
      );
    }

    switch (session.step) {
      case STORY_STEP.CREATE_PROFILE:
        return <ProfileScreen initialProfile={session.profile} onSubmit={submitProfile} />;
      case STORY_STEP.APARTMENT:
        return (
          <DialogueBox
            speaker={t("story.apartment.speaker")}
            body={t("story.apartment.body")}
            actionLabel={t("common.continue")}
            reducedMotion={reducedMotion}
            caption={preferences.captions ? t("accessibility.explosion") : undefined}
            onAction={() => goTo(STORY_STEP.TELEVISION)}
          />
        );
      case STORY_STEP.TELEVISION:
        return (
          <DialogueBox
            speaker={t("story.television.speaker")}
            body={t("story.television.body")}
            actionLabel={t("common.continue")}
            reducedMotion={reducedMotion}
            onAction={() => goTo(STORY_STEP.FAMILY)}
          />
        );
      case STORY_STEP.FAMILY:
        return session.profile ? (
          <FamilyScreen
            ageBand={session.profile.ageBand}
            initialFamily={session.family}
            onSubmit={submitFamily}
          />
        ) : null;
      case STORY_STEP.PACKING:
        return (
          <PackingScreen
            onSubmit={(packing) => dispatchGame({ type: GAME_EVENT.SET_PACKING, packing })}
          />
        );
      case STORY_STEP.FIRST_LOSS:
        return (
          <LossScreen
            session={session}
            timed={false}
            paused={gameplayPaused}
            onToggle={(slipId) => dispatchGame({ type: GAME_EVENT.TOGGLE_PENDING_LOSS, slipId })}
            onConfirm={() =>
              dispatchMany(
                { type: GAME_EVENT.COMMIT_SELECTED_LOSSES, cause: LOSS_CAUSE.FIRST_DEPARTURE },
                { type: GAME_EVENT.GO_TO, step: STORY_STEP.VILLAGE },
              )
            }
            onExpire={() => undefined}
          />
        );
      case STORY_STEP.VILLAGE:
        return (
          <DialogueBox
            speaker={t("story.village.speaker")}
            body={t("story.village.body")}
            actionLabel={t("common.continue")}
            reducedMotion={reducedMotion}
            onAction={() => dispatchGame({ type: GAME_EVENT.START_TIMED_LOSS })}
          />
        );
      case STORY_STEP.TIMED_LOSS:
        return (
          <LossScreen
            session={session}
            timed
            paused={gameplayPaused}
            onToggle={(slipId) => dispatchGame({ type: GAME_EVENT.TOGGLE_PENDING_LOSS, slipId })}
            onConfirm={() => dispatchGame({ type: GAME_EVENT.COMMIT_TIMED_LOSSES })}
            onExpire={() => dispatchGame({ type: GAME_EVENT.COMMIT_TIMED_LOSSES })}
            caption={preferences.captions ? t("accessibility.clock") : undefined}
          />
        );
      case STORY_STEP.JOURNEY:
        return (
          <DialogueBox
            speaker={t("story.journey.speaker")}
            body={t("story.journey.body")}
            actionLabel={t("common.continue")}
            reducedMotion={reducedMotion}
            caption={preferences.captions ? t("accessibility.footsteps") : undefined}
            onAction={() => goTo(STORY_STEP.FOREST)}
          />
        );
      case STORY_STEP.FOREST:
        return (
          <DialogueBox
            speaker={t("story.forest.speaker")}
            body={t("story.forest.body")}
            actionLabel={t("common.continue")}
            reducedMotion={reducedMotion}
            onAction={() => goTo(STORY_STEP.ARMED_ENCOUNTER)}
          />
        );
      case STORY_STEP.ARMED_ENCOUNTER:
        return (
          <DialogueBox
            speaker={t("story.armed.speaker")}
            body={t("story.armed.body")}
            actionLabel={t("story.escape")}
            reducedMotion={reducedMotion}
            caption={preferences.captions ? t("story.armedCaption") : undefined}
            onAction={() =>
              dispatchGame({
                type: GAME_EVENT.APPLY_RANDOM_LOSSES,
                cause: LOSS_CAUSE.ARMED_GROUP,
                count: 2,
                nextStep: STORY_STEP.CAMP,
              })
            }
          />
        );
      case STORY_STEP.CAMP:
        return (
          <DialogueBox
            speaker={t("story.camp.speaker")}
            body={t("story.camp.body")}
            actionLabel={t("common.continue")}
            reducedMotion={reducedMotion}
            onAction={() => goTo(STORY_STEP.ENDING)}
          />
        );
      case STORY_STEP.ENDING:
        return (
          <EndingScreen
            session={session}
            showCaptions={preferences.captions}
            onMenu={() => setSession(null)}
          />
        );
    }
  };

  return (
    <div className="app">
      <Suspense fallback={<div className="game-stage__canvas" aria-hidden="true" />}>
        <PhaserStage />
      </Suspense>
      <div className="game-stage__shade" aria-hidden="true" />
      <header className="app-bar">
        <button
          className="brand-button"
          type="button"
          aria-label={t("app.title")}
          onClick={() => setSession(null)}
        >
          <span className="brand-button__mark" aria-hidden="true">
            ◇
          </span>
          <span>{t("app.title")}</span>
        </button>
        <div className="app-bar__actions">
          {session ? <span className="chapter-chip">{t(`chapters.${session.step}`)}</span> : null}
          <button
            className="icon-button"
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={t("common.openSettings")}
          >
            <span aria-hidden="true">☼</span>
          </button>
        </div>
      </header>
      <div className={`story-layer story-layer--${session?.step ?? "menu"}`}>{renderStory()}</div>
      <Modal open={!warningAccepted} title={t("warning.title")} dismissible={false}>
        <div className="warning-copy">
          <p>{t("warning.body")}</p>
          <p>{t("warning.fiction")}</p>
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              rememberWarningAccepted();
              setWarningAccepted(true);
            }}
          >
            {t("warning.accept")}
          </button>
        </div>
      </Modal>
      <Modal
        open={confirmAction !== null}
        title={confirmAction?.kind === "delete" ? t("menu.deleteTitle") : t("menu.overwriteTitle")}
        onClose={() => setConfirmAction(null)}
      >
        <p>{confirmAction?.kind === "delete" ? t("menu.deleteBody") : t("menu.overwriteBody")}</p>
        <div className="modal__actions">
          <button
            className="button button--ghost"
            type="button"
            onClick={() => setConfirmAction(null)}
          >
            {t("common.cancel")}
          </button>
          <button className="button button--danger" type="button" onClick={confirmPendingAction}>
            {t("common.confirm")}
          </button>
        </div>
      </Modal>
      <SettingsPanel
        open={settingsOpen}
        preferences={preferences}
        onChange={setPreferences}
        onClose={() => setSettingsOpen(false)}
      />
      {portraitPhone ? <OrientationGuard /> : null}
    </div>
  );
}
