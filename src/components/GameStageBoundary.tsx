import { Component, type ReactNode } from "react";

interface GameStageBoundaryProps {
  children: ReactNode;
}

interface GameStageBoundaryState {
  failed: boolean;
}

export class GameStageBoundary extends Component<GameStageBoundaryProps, GameStageBoundaryState> {
  state: GameStageBoundaryState = { failed: false };

  static getDerivedStateFromError(): GameStageBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <div className="game-stage__canvas game-stage__canvas--fallback" aria-hidden="true" />;
    }
    return this.props.children;
  }
}
