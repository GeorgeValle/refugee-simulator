import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { PaperSlip } from "@/components/PaperSlip";
import { type GameSession, type MemorySlip, SLIP_KIND, SLIP_STATUS } from "@/game/model";
import { getPortraitAsset, getRelationshipPortrait } from "@/game/portraits";
import { analyzeArrival } from "@/game/unlockables";

const FAMILY_OUTCOME_STATUS = {
  SEPARATED: "separated",
  ARRIVED: "arrived",
} as const;

type FamilyOutcomeStatus = (typeof FAMILY_OUTCOME_STATUS)[keyof typeof FAMILY_OUTCOME_STATUS];

function describeLoss(slip: MemorySlip, t: TFunction): string {
  if (slip.kind === SLIP_KIND.FAMILY && slip.relationship) {
    return t("loss.family", {
      name: slip.value,
      relationship: t(`relationship.${slip.relationship}`),
    });
  }
  return t(`loss.${slip.kind}`, { value: slip.value });
}

interface FamilyOutcomeCardProps {
  slip: MemorySlip;
  status: FamilyOutcomeStatus;
}

function FamilyOutcomeCard({ slip, status }: FamilyOutcomeCardProps) {
  const { t } = useTranslation();
  if (!slip.relationship) return null;
  const separated = status === FAMILY_OUTCOME_STATUS.SEPARATED;

  return (
    <article className={`family-outcome-card${separated ? " family-outcome-card--separated" : ""}`}>
      <div className="family-outcome-card__portrait" aria-hidden="true">
        <img
          src={getPortraitAsset(getRelationshipPortrait(slip.relationship))}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
      <span className="family-outcome-card__status">
        {t(separated ? "ending.familySeparatedStatus" : "ending.familyArrivedStatus")}
      </span>
      <strong>{slip.value}</strong>
      <span>{t(`relationship.${slip.relationship}`)}</span>
      {separated ? (
        <>
          <p>{t("ending.familyUnknown")}</p>
          {slip.lossCause ? <small>{t(`loss.${slip.lossCause}`)}</small> : null}
        </>
      ) : null}
    </article>
  );
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
  const lostFamily = lost.filter((slip) => slip.kind === SLIP_KIND.FAMILY);
  const lostNonFamily = lost.filter((slip) => slip.kind !== SLIP_KIND.FAMILY);
  const arrivedFamily = remaining.filter((slip) => slip.kind === SLIP_KIND.FAMILY);
  const remainingNonFamily = remaining.filter((slip) => slip.kind !== SLIP_KIND.FAMILY);
  const arrival = analyzeArrival(session);
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
        {arrival ? (
          <section className="ending-personalized" aria-labelledby="personalized-ending-title">
            <h2 className="u-visually-hidden" id="personalized-ending-title">
              {t("ending.personalized.title")}
            </h2>
            {arrival.allFamilyArrived ? <p>{t("ending.personalized.allFamily")}</p> : null}
            <p>{t(`ending.personalized.age.${arrival.ageBand}`)}</p>
          </section>
        ) : null}
        {showCaptions ? (
          <p className="sound-caption sound-caption--center">{t("accessibility.softCrying")}</p>
        ) : null}
      </section>
      <section className="loss-summary" aria-labelledby="loss-summary-title">
        <h2 id="loss-summary-title">{t("ending.title")}</h2>
        <ol>
          {lostNonFamily.map((slip) => (
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
      {lostFamily.length > 0 ? (
        <section
          className="family-outcome-summary family-outcome-summary--separated"
          aria-labelledby="separated-family-title"
        >
          <h2 id="separated-family-title">{t("ending.separatedFamilyTitle")}</h2>
          <div className="family-outcome-grid">
            {lostFamily.map((slip) => (
              <FamilyOutcomeCard
                key={slip.id}
                slip={slip}
                status={FAMILY_OUTCOME_STATUS.SEPARATED}
              />
            ))}
          </div>
        </section>
      ) : null}
      <section className="remaining-summary" aria-labelledby="remaining-title">
        <h2 id="remaining-title">{t("ending.remainingTitle")}</h2>
        <div className="paper-grid paper-grid--compact">
          {remainingNonFamily.map((slip) => (
            <PaperSlip key={slip.id} slip={slip} />
          ))}
        </div>
      </section>
      <section className="family-outcome-summary" aria-labelledby="arrived-family-title">
        <h2 id="arrived-family-title">{t("ending.arrivedFamilyTitle")}</h2>
        {arrivedFamily.length > 0 ? (
          <div className="family-outcome-grid">
            {arrivedFamily.map((slip) => (
              <FamilyOutcomeCard key={slip.id} slip={slip} status={FAMILY_OUTCOME_STATUS.ARRIVED} />
            ))}
          </div>
        ) : (
          <p className="family-outcome-summary__empty">{t("ending.noFamilyArrived")}</p>
        )}
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
