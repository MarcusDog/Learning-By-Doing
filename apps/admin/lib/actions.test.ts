import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  const error = new Error("NEXT_REDIRECT") as Error & { digest?: string };
  error.digest = `NEXT_REDIRECT;replace;${url};307;`;
  throw error;
});
const createAdminUnitMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("./admin-data", () => ({
  createAdminUnit: createAdminUnitMock,
  seedAdminContent: vi.fn(),
  publishUnit: vi.fn(),
  updatePromptTemplate: vi.fn(),
  updatePublishingCheck: vi.fn(),
  updateUnitReview: vi.fn(),
  updateUnitStatus: vi.fn(),
}));

describe("admin server actions", () => {
  beforeEach(() => {
    revalidatePathMock.mockReset();
    redirectMock.mockClear();
    createAdminUnitMock.mockReset();
  });

  it("keeps the success redirect when creating a draft unit", async () => {
    createAdminUnitMock.mockResolvedValue({
      slug: "automation-admin-qa",
    });

    const { createUnitAction } = await import("../app/actions");
    const formData = new FormData();
    formData.set("title", "自动化 QA 单元");
    formData.set("slug", "automation-admin-qa");
    formData.set("pathId", "python-foundations");
    formData.set("audienceLevel", "beginner_first");
    formData.set("visualizationKind", "control-flow");
    formData.set("learningGoal", "验证内容工厂端到端流程是否真的可用。");

    await expect(createUnitAction(formData)).rejects.toMatchObject({
      digest:
        "NEXT_REDIRECT;replace;/?status=success&message=%E5%B7%B2%E5%88%9B%E5%BB%BA%E8%8D%89%E7%A8%BF%E5%8D%95%E5%85%83%20automation-admin-qa%E3%80%82;307;",
    });
    expect(createAdminUnitMock).toHaveBeenCalledWith({
      audience_level: "beginner_first",
      learning_goal: "验证内容工厂端到端流程是否真的可用。",
      path_id: "python-foundations",
      slug: "automation-admin-qa",
      title: "自动化 QA 单元",
      visualization_kind: "control-flow",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(redirectMock).toHaveBeenCalledTimes(1);
  });

  it("preserves the intended validation redirect when title or slug is missing", async () => {
    const { createUnitAction } = await import("../app/actions");
    const formData = new FormData();
    formData.set("title", "");
    formData.set("slug", "");

    await expect(createUnitAction(formData)).rejects.toMatchObject({
      digest:
        "NEXT_REDIRECT;replace;/?status=error&message=%E8%AF%B7%E5%85%88%E5%A1%AB%E5%86%99%E5%8D%95%E5%85%83%E6%A0%87%E9%A2%98%E5%92%8C%20slug%E3%80%82;307;",
    });
    expect(createAdminUnitMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledTimes(1);
  });
});
