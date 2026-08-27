import { useTranslation } from "react-i18next";
import { UNLOCKABLE_IDS, type UnlockableProgress } from "@/game/unlockables";

interface UnlockablesScreenProps {
  progress: UnlockableProgress;
  onBack: () => void;
}

export function UnlockablesScreen({ progress, onBack }: UnlockablesScreenProps) {
  const { t } = useTranslation();
  const unlockedIds = new Set(progress.entries.map(({ id }) => id));

  return (
    <main className="unlockables-screen">
      <section className="unlockables-panel" aria-labelledby="unlockables-title">
        <span className="eyebrow">{t("unlockables.eyebrow")}</span>
        <h1 id="unlockables-title" data-story-focus="true" tabIndex={-1}>
          {t("unlockables.title")}
        </h1>
        <p className="unlockables-panel__intro">{t("unlockables.intro")}</p>
        <div className="unlockables-grid">
          {UNLOCKABLE_IDS.map((id) => {
            const unlocked = unlockedIds.has(id);
            return (
              <article
                className={`unlockable-card${unlocked ? " unlockable-card--unlocked" : ""}`}
                key={id}
              >
                <span className="unlockable-card__symbol" aria-hidden="true">
                  {unlocked ? "◇" : "◆"}
                </span>
                <div>
                  <span className="unlockable-card__status">
                    {t(unlocked ? "unlockables.unlocked" : "unlockables.locked")}
                  </span>
                  <h2>{t(`unlockables.cards.${id}.title`)}</h2>
                  <p>{t(`unlockables.cards.${id}.condition`)}</p>
                </div>
              </article>
            );
          })}
        </div>
        <button className="button button--primary" type="button" onClick={onBack}>
          {t("unlockables.back")}
        </button>
      </section>
    </main>
  );
}
