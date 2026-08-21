import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PaperSlip } from "@/components/PaperSlip";
import { type GameSession, SLIP_STATUS } from "@/game/model";

interface LossScreenProps {
  session: GameSession;
  timed: boolean;
  paused: boolean;
  onToggle: (slipId: string) => void;
  onConfirm: () => void;
  onExpire: () => void;
  caption?: string | undefined;
}

export function LossScreen({
  session,
  timed,
  paused,
  onToggle,
  onConfirm,
  onExpire,
  caption,
}: LossScreenProps) {
  const { t } = useTranslation();
  const [remainingMs, setRemainingMs] = useState(
    session.timerDeadline
      ? Math.max(0, session.timerDeadline - Date.now())
      : (session.timerRemainingMs ?? 10_000),
  );
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!timed || paused || session.timerDeadline === null) return undefined;
    const update = () => {
      const next = Math.max(0, session.timerDeadline ? session.timerDeadline - Date.now() : 0);
      setRemainingMs(next);
      if (next === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    };
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [onExpire, paused, session.timerDeadline, timed]);

  useEffect(() => {
    if (paused && session.timerRemainingMs !== null) setRemainingMs(session.timerRemainingMs);
  }, [paused, session.timerRemainingMs]);

  const activeSlips = session.slips.filter((slip) => slip.status === SLIP_STATUS.ACTIVE);
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return (
    <main className="panel-screen panel-screen--loss">
      <section className="loss-board">
        <div className="loss-board__header">
          <div>
            <span className="eyebrow">
              {timed ? t("story.timedLoss.body") : t("story.firstLoss.body")}
            </span>
            <h1>{t("loss.title")}</h1>
          </div>
          {timed ? (
            <div className={`timer${seconds <= 3 ? " timer--urgent" : ""}`} aria-live="assertive">
              <span className="timer__number">{seconds}</span>
              <span>{t("common.seconds")}</span>
              <div className="timer__track" aria-hidden="true">
                <span style={{ width: `${Math.min(100, (remainingMs / 10_000) * 100)}%` }} />
              </div>
            </div>
          ) : null}
        </div>
        <p className="loss-board__count" aria-live="polite">
          {t("loss.selectedCount", { count: session.pendingLossIds.length })}
        </p>
        {caption ? <p className="sound-caption">{caption}</p> : null}
        <div className="paper-grid">
          {activeSlips.map((slip) => {
            const selected = session.pendingLossIds.includes(slip.id);
            return (
              <PaperSlip
                key={slip.id}
                slip={slip}
                selected={selected}
                disabled={!selected && session.pendingLossIds.length >= 2}
                onToggle={() => onToggle(slip.id)}
              />
            );
          })}
        </div>
        <div className="loss-board__actions">
          <button
            className="button button--danger"
            type="button"
            disabled={session.pendingLossIds.length !== 2}
            onClick={onConfirm}
          >
            {t("loss.confirm")}
          </button>
        </div>
      </section>
    </main>
  );
}
