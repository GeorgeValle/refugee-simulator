import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface DialogueBoxProps {
  speaker: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  reducedMotion: boolean;
  caption?: string | undefined;
}

export function DialogueBox({
  speaker,
  body,
  actionLabel,
  onAction,
  reducedMotion,
  caption,
}: DialogueBoxProps) {
  const { t } = useTranslation();
  const [visibleCharacters, setVisibleCharacters] = useState(reducedMotion ? body.length : 0);
  const complete = visibleCharacters >= body.length;

  useEffect(() => {
    setVisibleCharacters(reducedMotion ? body.length : 0);
  }, [body, reducedMotion]);

  useEffect(() => {
    if (complete || reducedMotion) return undefined;
    const timer = window.setInterval(() => {
      setVisibleCharacters((current) => Math.min(body.length, current + 2));
    }, 22);
    return () => window.clearInterval(timer);
  }, [body.length, complete, reducedMotion]);

  return (
    <section
      className="dialogue"
      aria-label={t("accessibility.dialogue")}
      data-story-focus="true"
      tabIndex={-1}
    >
      <span className="dialogue__speaker">{speaker}</span>
      <p className="dialogue__text" aria-hidden="true">
        {body.slice(0, visibleCharacters)}
        {!complete ? <span className="dialogue__cursor">▋</span> : null}
      </p>
      <span className="u-visually-hidden" aria-live="polite">
        {body}
      </span>
      {caption ? (
        <p className="sound-caption">
          <span aria-hidden="true">◖◗</span> {caption}
        </p>
      ) : null}
      <div className="dialogue__actions">
        {!complete ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setVisibleCharacters(body.length)}
          >
            {t("common.skip")}
          </button>
        ) : null}
        <button type="button" className="button button--primary" onClick={onAction}>
          {actionLabel}
          <span aria-hidden="true"> →</span>
        </button>
      </div>
    </section>
  );
}
