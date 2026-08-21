import { useTranslation } from "react-i18next";
import { type SaveSlot, type SaveSlotId, STORY_STEP } from "@/game/model";

interface MenuScreenProps {
  slots: SaveSlot[];
  onNew: (slotId: SaveSlotId) => void;
  onContinue: (slotId: SaveSlotId) => void;
  onDelete: (slotId: SaveSlotId) => void;
}

export function MenuScreen({ slots, onNew, onContinue, onDelete }: MenuScreenProps) {
  const { t, i18n } = useTranslation();
  return (
    <main className="menu-screen">
      <div className="menu-screen__title">
        <span className="eyebrow">{t("app.subtitle")}</span>
        <h1>{t("app.title")}</h1>
        <div className="title-divider" />
      </div>
      <section className="save-slots" aria-labelledby="save-title">
        <h2 id="save-title">{t("menu.startHere")}</h2>
        <div className="save-slots__grid">
          {slots.map(({ slotId, session }) => (
            <article className={`save-card${session ? " save-card--filled" : ""}`} key={slotId}>
              <div className="save-card__number">{String(slotId).padStart(2, "0")}</div>
              <h3>{t("menu.slot", { number: slotId })}</h3>
              {session ? (
                <>
                  <p className="save-card__chapter">
                    {t("menu.chapter", { chapter: t(`chapters.${session.step}`) })}
                  </p>
                  {session.profile ? (
                    <p>
                      {t("menu.profile", {
                        gender: t(`gender.${session.profile.gender}`),
                        age: t(`age.${session.profile.ageBand}`),
                      })}
                    </p>
                  ) : null}
                  <small>
                    {t("menu.lastPlayed", {
                      date: new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(session.updatedAt),
                    })}
                  </small>
                  <div className="save-card__actions">
                    <button
                      className="button button--primary"
                      type="button"
                      onClick={() => onContinue(slotId)}
                    >
                      {session.step === STORY_STEP.ENDING
                        ? t("menu.continueGame")
                        : t("common.continue")}
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => onNew(slotId)}
                    >
                      {t("menu.newGame")}
                    </button>
                    <button
                      className="text-button text-button--danger"
                      type="button"
                      onClick={() => onDelete(slotId)}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>{t("menu.emptySlot")}</p>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => onNew(slotId)}
                  >
                    {t("menu.newGame")}
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
        <p className="menu-screen__privacy">◆ {t("menu.localOnly")}</p>
      </section>
    </main>
  );
}
