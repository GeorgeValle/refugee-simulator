import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export function OrientationGuard() {
  const { t } = useTranslation();
  const guardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    guardRef.current?.focus();
    return () => previous?.focus();
  }, []);

  return (
    <div
      ref={guardRef}
      className="orientation-guard"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="orientation-title"
      aria-describedby="orientation-description orientation-paused"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          guardRef.current?.focus();
        }
      }}
    >
      <div className="orientation-guard__phone" aria-hidden="true">
        <span />
      </div>
      <h1 id="orientation-title">{t("orientation.title")}</h1>
      <p id="orientation-description">{t("orientation.body")}</p>
      <small id="orientation-paused">{t("orientation.paused")}</small>
    </div>
  );
}
