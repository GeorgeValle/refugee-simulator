import { beforeEach, describe, expect, it, vi } from "vitest";

describe("GameBridge", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("entrega el desbloqueo de audio a un suscriptor que llega tarde", async () => {
    const { gameBridge } = await import("@/game/bridge");
    const listener = vi.fn();

    gameBridge.emit("unlockAudio", undefined);
    gameBridge.on("unlockAudio", listener);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(undefined);
  });

  it("entrega el desbloqueo normalmente a un suscriptor existente", async () => {
    const { gameBridge } = await import("@/game/bridge");
    const listener = vi.fn();

    gameBridge.on("unlockAudio", listener);
    gameBridge.emit("unlockAudio", undefined);

    expect(listener).toHaveBeenCalledOnce();
  });
});
