import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSession, type GameSession, STORY_STEP } from "@/game/model";
import { LossScreen } from "@/screens/LossScreen";
import "@/i18n";

function timedSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    ...createSession(1, Date.now()),
    step: STORY_STEP.TIMED_LOSS,
    timerDeadline: Date.now() + 500,
    ...overrides,
  };
}

describe("LossScreen timer", () => {
  afterEach(() => vi.useRealTimers());

  it("expires exactly once when the deadline is reached", () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const onExpire = vi.fn();
    render(
      <LossScreen
        session={timedSession()}
        timed
        paused={false}
        onToggle={vi.fn()}
        onConfirm={vi.fn()}
        onExpire={onExpire}
      />,
    );

    act(() => vi.advanceTimersByTime(800));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("does not expire while portrait mode has paused the timer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(20_000);
    const onExpire = vi.fn();
    render(
      <LossScreen
        session={timedSession({ timerDeadline: null, timerRemainingMs: 500 })}
        timed
        paused
        onToggle={vi.fn()}
        onConfirm={vi.fn()}
        onExpire={onExpire}
      />,
    );

    act(() => vi.advanceTimersByTime(2_000));
    expect(onExpire).not.toHaveBeenCalled();
  });
});
