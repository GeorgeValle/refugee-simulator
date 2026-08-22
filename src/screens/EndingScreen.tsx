import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { PaperSlip } from "@/components/PaperSlip";
import { type GameSession, type MemorySlip, SLIP_KIND, SLIP_STATUS } from "@/game/model";

function describeLoss(slip: MemorySlip, t: TFunction): string {
  if (slip.kind === SLIP_KIND.FAMILY && slip.relationship) {
    return t("loss.family", {
      name: slip.value,
      relationship: t(`relationship.${slip.relationship}`),
    });
  }
  return t(`loss.${slip.kind}`, { value: slip.value });
}

interface EndingScreenProps {
  session: GameSession;
  showCaptions: boolean;
  onMenu: () => void;
}

export function EndingScreen({ session, showCaptions, onMenu }: EndingScreenProps) {
  const { t } = useTranslation();
  const lost = session.slips.filter((slip) => slip.status === SLIP_STATUS.LOST);
  const remaining = session.slips.filter((slip) => slip.status === SLIP_STATUS.ACTIVE);
  const facts = [
    [t("ending.factDisplacedValue"), t("ending.factDisplacedLabel")],
    [t("ending.factChildrenValue"), t("ending.factChildrenLabel")],
    [t("ending.factIncomeValue"), t("ending.factIncomeLabel")],
    [t("ending.factNeighbourValue"), t("ending.factNeighbourLabel")],
  ];

  return (
    <main className="ending-screen">
      <section className="ending-hero">
        <span className="eyebrow">{t("ending.eyebrow")}</span>
        <h1 data-story-focus="true" tabIndex={-1}>
          {t("ending.title")}
        </h1>
        <p>{t("story.reflection")}</p>
        {showCaptions ? (
          <p className="sound-caption sound-caption--center">{t("accessibility.softCrying")}</p>
        ) : null}
      </section>
      <section className="loss-summary" aria-labelledby="loss-summary-title">
        <h2 id="loss-summary-title">{t("ending.title")}</h2>
        <ol>
          {lost.map((slip) => (
            <li key={slip.id}>
              <span className="loss-summary__tear" aria-hidden="true" />
              <div>
                <p>{describeLoss(slip, t)}</p>
                <small>{slip.lossCause ? t(`loss.${slip.lossCause}`) : null}</small>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="remaining-summary" aria-labelledby="remaining-title">
        <h2 id="remaining-title">{t("ending.remainingTitle")}</h2>
        <div className="paper-grid paper-grid--compact">
          {remaining.map((slip) => (
            <PaperSlip key={slip.id} slip={slip} />
          ))}
        </div>
      </section>
      <section className="facts-panel" aria-labelledby="facts-title">
        <span className="eyebrow">{t("ending.sourceEyebrow")}</span>
        <h2 id="facts-title">{t("ending.factsTitle")}</h2>
        <p>{t("ending.factsIntro")}</p>
        <div className="facts-grid">
          {facts.map(([value, label]) => (
            <article key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
        <a
          className="button button--light"
          href="https://www.unhcr.org/refugee-statistics"
          target="_blank"
          rel="noreferrer"
        >
          {t("ending.source")} ↗
        </a>
      </section>
      <section className="ending-reflection">
        <p>{t("story.notUniversal")}</p>
        <button className="button button--primary" type="button" onClick={onMenu}>
          {t("ending.restart")}
        </button>
      </section>
    </main>
  );
}
