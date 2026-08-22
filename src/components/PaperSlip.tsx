import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { type MemorySlip, SLIP_KIND } from "@/game/model";

export function getSlipLabel(slip: MemorySlip, t: TFunction): string {
  if (slip.kind === SLIP_KIND.FAMILY && slip.relationship) {
    return `${slip.value} · ${t(`relationship.${slip.relationship}`)}`;
  }
  return slip.value;
}

interface PaperSlipProps {
  slip: MemorySlip;
  selected?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}

export function PaperSlip({ slip, selected = false, disabled = false, onToggle }: PaperSlipProps) {
  const { t } = useTranslation();
  const label = getSlipLabel(slip, t);
  const content = (
    <>
      <span className="paper-slip__kind">{t(`slips.${slip.kind}`)}</span>
      <strong>{label}</strong>
      {selected ? (
        <span className="paper-slip__mark" aria-hidden="true">
          ×
        </span>
      ) : null}
    </>
  );

  if (!onToggle) return <article className="paper-slip">{content}</article>;
  return (
    <button
      type="button"
      className={`paper-slip paper-slip--button${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      aria-label={
        selected
          ? t("accessibility.paperSelected", { label })
          : t("accessibility.paperUnselected", { label })
      }
      disabled={disabled}
      onClick={onToggle}
    >
      {content}
    </button>
  );
}
