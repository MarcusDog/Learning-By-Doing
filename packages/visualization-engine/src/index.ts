export type TraceFrame = {
  step: string;
  description: string;
  visibleState: Record<string, string | number | boolean | null>;
};

export type VisualizationSpec = {
  kind: "flow" | "state" | "paper" | "exercise";
  frames: TraceFrame[];
};

export function buildVisualizationSpec(frames: TraceFrame[]): VisualizationSpec {
  return { kind: "state", frames };
}

