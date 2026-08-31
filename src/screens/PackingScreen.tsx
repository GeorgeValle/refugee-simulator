import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import { type AgeBand, usesSportSlip } from "@/game/model";
import { packingInputSchema } from "@/game/schema";

type PackingFormValues = z.infer<typeof packingInputSchema>;

interface PackingScreenProps {
  ageBand: AgeBand;
  onSubmit: (packing: PackingFormValues) => void;
}

export function PackingScreen({ ageBand, onSubmit }: PackingScreenProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PackingFormValues>({
    resolver: zodResolver(packingInputSchema),
    defaultValues: {
      objects: ["", "", "", ""],
      personalActivity: "",
      skill: "",
      clothing: "",
      dream: "",
    },
  });
  const personalActivityKey = usesSportSlip(ageBand) ? "sport" : "profession";

  return (
    <main className="panel-screen">
      <form className="form-card form-card--wide" onSubmit={handleSubmit(onSubmit)}>
        <span className="eyebrow">{t("story.packing.body")}</span>
        <h1 data-story-focus="true" tabIndex={-1}>
          {t("slips.title")}
        </h1>
        <p className="form-card__lead">{t("slips.instructions")}</p>
        <div className="packing-layout">
          <fieldset className="packing-section">
            <legend>{t("slips.objectsCategory")}</legend>
            <div className="lined-paper-grid">
              {[0, 1, 2, 3].map((index) => (
                <label className="lined-field" key={`object-${index + 1}`}>
                  <span>{t("slips.object", { number: index + 1 })}</span>
                  <input
                    {...register(`objects.${index}` as const)}
                    maxLength={60}
                    placeholder={t("slips.objectPlaceholder")}
                  />
                  {errors.objects?.[index] ? <small>{t("common.required")}</small> : null}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="packing-section">
            <legend>{t("slips.identityCategory")}</legend>
            <div className="lined-paper-grid">
              {(["personalActivity", "skill", "clothing", "dream"] as const).map((key) => (
                <label className="lined-field" key={key}>
                  <span>
                    {t(
                      key === "personalActivity" ? `slips.${personalActivityKey}` : `slips.${key}`,
                    )}
                  </span>
                  <input
                    {...register(key)}
                    maxLength={key === "dream" ? 120 : 60}
                    placeholder={t(
                      key === "personalActivity"
                        ? `slips.${personalActivityKey}Placeholder`
                        : `slips.${key}Placeholder`,
                    )}
                  />
                  {errors[key] ? <small>{t("common.required")}</small> : null}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="form-card__actions">
          <button className="button button--primary" type="submit">
            {t("common.continue")} →
          </button>
        </div>
      </form>
    </main>
  );
}
