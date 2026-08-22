import Phaser from "phaser";
import { useEffect, useRef } from "react";
import { NarrativeScene } from "@/game/NarrativeScene";

export function PhaserStage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 1600,
      height: 900,
      backgroundColor: "#080f1e",
      scene: [NarrativeScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
        powerPreference: "high-performance",
      },
      audio: {
        noAudio: true,
      },
    });
    return () => game.destroy(true);
  }, []);

  return <div ref={containerRef} className="game-stage__canvas" aria-hidden="true" />;
}
