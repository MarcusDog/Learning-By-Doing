import { describe, expect, it } from "vitest";

import type { AdminUnitSummary } from "./admin-data";
import { getCustomDraftUnits, getOriginBadgeLabel } from "./admin-presentation";

function createUnit(overrides: Partial<AdminUnitSummary>): AdminUnitSummary {
  return {
    slug: "unit",
    title: "Unit",
    audienceLevel: "beginner_first",
    learningGoal: "Goal",
    origin: "seeded",
    prerequisiteCount: 0,
    practiceTaskCount: 0,
    acceptanceCriteriaCount: 0,
    visualizationKind: "control-flow",
    pathIds: ["python-foundations"],
    pathTitles: ["Python 入门"],
    contentStatus: "draft",
    readyToPublish: false,
    publishBlockers: [],
    reviewNotes: null,
    reviewedCheckKeys: [],
    ...overrides,
  };
}

describe("admin presentation helpers", () => {
  it("keeps the custom draft list limited to custom units still in draft", () => {
    const result = getCustomDraftUnits([
      createUnit({ slug: "custom-draft", origin: "custom", contentStatus: "draft" }),
      createUnit({ slug: "custom-review", origin: "custom", contentStatus: "review" }),
      createUnit({ slug: "custom-published", origin: "custom", contentStatus: "published" }),
      createUnit({ slug: "seeded-draft", origin: "seeded", contentStatus: "draft" }),
    ]);

    expect(result.map((unit) => unit.slug)).toEqual(["custom-draft"]);
  });

  it("uses neutral origin badge copy so non-draft custom units are not mislabeled", () => {
    expect(getOriginBadgeLabel("custom")).toBe("自建单元");
    expect(getOriginBadgeLabel("seeded")).toBe("种子单元");
  });
});
