import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type AgeBand,
  canAddRelationship,
  createId,
  type FamilyMember,
  getEligibleRelationships,
  REPEATABLE_RELATIONSHIPS,
  type Relationship,
} from "@/game/model";
import { getPortraitAsset, getRelationshipPortrait } from "@/game/portraits";

interface FamilyDraft {
  id: string;
  name: string;
  relationship: Relationship | "";
}

interface FamilyScreenProps {
  ageBand: AgeBand;
  initialFamily: FamilyMember[];
  onSubmit: (family: FamilyMember[]) => void;
}

export function FamilyScreen({ ageBand, initialFamily, onSubmit }: FamilyScreenProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<FamilyDraft[]>(() =>
    Array.from({ length: 4 }, (_, index) => ({
      id: initialFamily[index]?.id ?? createId("family-draft"),
      name: initialFamily[index]?.name ?? "",
      relationship: initialFamily[index]?.relationship ?? "",
    })),
  );
  const [attempted, setAttempted] = useState(false);
  const eligible = getEligibleRelationships(ageBand);

  const updateRow = (index: number, patch: Partial<FamilyDraft>) => {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
  };

  const isValid = rows.every(
    (row) => row.name.trim().length > 0 && row.name.trim().length <= 40 && row.relationship,
  );
  const hasForbiddenDuplicate = rows.some((row, index) => {
    if (!row.relationship || REPEATABLE_RELATIONSHIPS.has(row.relationship)) return false;
    return rows.findIndex((candidate) => candidate.relationship === row.relationship) !== index;
  });

  const submit = () => {
    setAttempted(true);
    if (!isValid || hasForbiddenDuplicate) return;
    onSubmit(
      rows.map((row) => ({
        id: row.id,
        name: row.name.trim(),
        relationship: row.relationship as Relationship,
      })),
    );
  };

  return (
    <main className="panel-screen">
      <section className="form-card form-card--wide">
        <span className="eyebrow">{t("story.familyIntro")}</span>
        <h1 data-story-focus="true" tabIndex={-1}>
          {t("family.title")}
        </h1>
        <p className="form-card__lead">{t("family.instructions")}</p>
        <div className="family-grid">
          {rows.map((row, index) => {
            const selectedElsewhere = rows
              .filter((_, rowIndex) => rowIndex !== index)
              .flatMap((candidate) => (candidate.relationship ? [candidate.relationship] : []));
            return (
              <fieldset className="family-card" key={row.id}>
                <legend>{t("family.member", { number: index + 1 })}</legend>
                <div className="family-card__portrait" aria-hidden="true">
                  {row.relationship ? (
                    <img
                      src={getPortraitAsset(getRelationshipPortrait(row.relationship, ageBand))}
                      alt=""
                    />
                  ) : (
                    <span>·</span>
                  )}
                </div>
                <label>
                  <span>{t("family.relationship")}</span>
                  <select
                    value={row.relationship}
                    onChange={(event) =>
                      updateRow(index, { relationship: event.target.value as Relationship })
                    }
                  >
                    <option value="">{t("family.relationshipPlaceholder")}</option>
                    {eligible.map((relationship) => (
                      <option
                        key={relationship}
                        value={relationship}
                        disabled={
                          relationship !== row.relationship &&
                          !canAddRelationship(relationship, selectedElsewhere)
                        }
                      >
                        {t(`relationship.${relationship}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{t("family.name")}</span>
                  <input
                    value={row.name}
                    maxLength={40}
                    autoComplete="off"
                    placeholder={t("family.namePlaceholder")}
                    onChange={(event) => updateRow(index, { name: event.target.value })}
                  />
                </label>
              </fieldset>
            );
          })}
        </div>
        {attempted && !isValid ? <p className="field-error">{t("common.required")}</p> : null}
        {attempted && hasForbiddenDuplicate ? (
          <p className="field-error">{t("family.duplicate")}</p>
        ) : null}
        <div className="form-card__actions">
          <button className="button button--primary" type="button" onClick={submit}>
            {t("common.continue")} →
          </button>
        </div>
      </section>
    </main>
  );
}
