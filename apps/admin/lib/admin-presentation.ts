import type { AdminUnitOrigin } from "@learning-by-doing/shared-types";

import type { AdminUnitSummary } from "./admin-data";

export function getCustomDraftUnits(units: AdminUnitSummary[]) {
  return units.filter((unit) => unit.origin === "custom" && unit.contentStatus === "draft");
}

export function getOriginBadgeLabel(origin: AdminUnitOrigin) {
  return origin === "custom" ? "自建单元" : "种子单元";
}
