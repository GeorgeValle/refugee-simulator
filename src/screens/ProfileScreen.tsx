import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AGE_BAND, type AgeBand, type CharacterProfile, GENDER, type Gender } from "@/game/model";
import { getPortraitAsset } from "@/game/portraits";

interface ProfileScreenProps {
  initialProfile: CharacterProfile | null;
  onSubmit: (profile: CharacterProfile) => void;
}

export function ProfileScreen({ initialProfile, onSubmit }: ProfileScreenProps) {
  const { t } = useTranslation();
  const [gender, setGender] = useState<Gender | null>(initialProfile?.gender ?? null);
  const [ageBand, setAgeBand] = useState<AgeBand | null>(initialProfile?.ageBand ?? null);
  const [attempted, setAttempted] = useState(false);

  const submit = () => {
    setAttempted(true);
    if (gender && ageBand) onSubmit({ gender, ageBand });
  };

  return (
    <main className="panel-screen panel-screen--profile">
      <section className="form-card">
        <span className="eyebrow">{t("profile.eyebrow")}</span>
        <h1>{t("profile.title")}</h1>
        <fieldset className="choice-group">
          <legend>{t("profile.genderQuestion")}</legend>
          <div className="choice-grid choice-grid--two">
            {Object.values(GENDER).map((value) => (
              <button
                type="button"
                key={value}
                className={`choice-card${gender === value ? " is-selected" : ""}`}
                aria-pressed={gender === value}
                onClick={() => setGender(value)}
              >
                <img
                  className="choice-card__character"
                  src={getPortraitAsset({ gender: value, ageBand: AGE_BAND.YOUTH })}
                  alt=""
                  aria-hidden="true"
                />
                <strong>{t(`gender.${value}`)}</strong>
              </button>
            ))}
          </div>
          {attempted && !gender ? (
            <p className="field-error">{t("profile.genderRequired")}</p>
          ) : null}
        </fieldset>
        <fieldset className="choice-group">
          <legend>{t("profile.ageQuestion")}</legend>
          <div className="choice-grid choice-grid--ages">
            {Object.values(AGE_BAND).map((value, index) => (
              <button
                type="button"
                key={value}
                className={`choice-card choice-card--age${ageBand === value ? " is-selected" : ""}`}
                aria-pressed={ageBand === value}
                onClick={() => setAgeBand(value)}
              >
                {gender ? (
                  <img
                    className="choice-card__age-character"
                    src={getPortraitAsset({ gender, ageBand: value })}
                    alt=""
                    aria-hidden="true"
                  />
                ) : null}
                <span className="choice-card__age-number">0{index + 1}</span>
                <strong>{t(`age.${value}`)}</strong>
              </button>
            ))}
          </div>
          {attempted && !ageBand ? <p className="field-error">{t("profile.ageRequired")}</p> : null}
        </fieldset>
        <div className="form-card__actions">
          <button className="button button--primary" type="button" onClick={submit}>
            {t("common.continue")} →
          </button>
        </div>
      </section>
    </main>
  );
}
