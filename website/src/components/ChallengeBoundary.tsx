"use client";

import { Component, type ReactNode } from "react";
import { ChallengePlaceholder } from "./ChallengePlaceholder";

export class ChallengeBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <ChallengePlaceholder error />
    ) : (
      this.props.children
    );
  }
}
