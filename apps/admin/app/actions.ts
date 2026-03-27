"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import {
  createAdminUnit,
  seedAdminContent,
  type AdminUnitStatus,
  publishUnit,
  type PromptTemplateStatus,
  updatePublishingCheck,
  updatePromptTemplate,
  updateUnitReview,
  updateUnitStatus,
} from "../lib/admin-data";

function getStringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBooleanField(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function redirectWithMessage(status: "success" | "error", message: string) {
  redirect(`/?status=${status}&message=${encodeURIComponent(message)}`);
}

function handleActionError(error: unknown, fallbackMessage: string) {
  if (isRedirectError(error)) {
    throw error;
  }

  return redirectWithMessage("error", error instanceof Error ? error.message : fallbackMessage);
}

export async function seedContentAction() {
  try {
    const result = await seedAdminContent();
    revalidatePath("/");
    redirect(
      `/?seeded=${result.seeded}&status=success&message=${encodeURIComponent("示例内容已重新补种。")}`,
    );
  } catch (error) {
    handleActionError(error, "补种示例内容失败。");
  }
}

export async function updateUnitStatusAction(formData: FormData) {
  const slug = getStringField(formData, "slug");
  const contentStatus = getStringField(formData, "contentStatus");

  try {
    await updateUnitStatus(slug, contentStatus as AdminUnitStatus);
    revalidatePath("/");
    redirectWithMessage("success", `单元 ${slug} 状态已更新。`);
  } catch (error) {
    handleActionError(error, `单元 ${slug} 状态更新失败。`);
  }
}

export async function createUnitAction(formData: FormData) {
  try {
    const title = getStringField(formData, "title").trim();
    const slug = getStringField(formData, "slug").trim();

    if (!title || !slug) {
      redirectWithMessage("error", "请先填写单元标题和 slug。");
    }

    await createAdminUnit({
      slug,
      title,
      path_id: getStringField(formData, "pathId") as "python-foundations" | "ai-basics" | "algorithm-visualization",
      audience_level: getStringField(formData, "audienceLevel") as "beginner_first" | "intermediate" | "advanced",
      learning_goal: getStringField(formData, "learningGoal"),
      visualization_kind: getStringField(formData, "visualizationKind") as
        | "variable-state"
        | "control-flow"
        | "call-stack"
        | "data-structure"
        | "algorithm-flow"
        | "tensor-shape",
    });

    revalidatePath("/");
    redirectWithMessage("success", `已创建草稿单元 ${slug}。`);
  } catch (error) {
    handleActionError(error, "创建草稿单元失败。");
  }
}

export async function queueUnitForReviewAction(formData: FormData) {
  const slug = getStringField(formData, "slug");

  try {
    await updateUnitStatus(slug, "review");
    revalidatePath("/");
    redirectWithMessage("success", `单元 ${slug} 已送入审核队列。`);
  } catch (error) {
    handleActionError(error, `单元 ${slug} 送审失败。`);
  }
}

export async function archiveUnitAction(formData: FormData) {
  const slug = getStringField(formData, "slug");

  try {
    await updateUnitStatus(slug, "archived");
    revalidatePath("/");
    redirectWithMessage("success", `单元 ${slug} 已归档。`);
  } catch (error) {
    handleActionError(error, `单元 ${slug} 归档失败。`);
  }
}

export async function moveUnitBackToDraftAction(formData: FormData) {
  const slug = getStringField(formData, "slug");

  try {
    await updateUnitStatus(slug, "draft");
    revalidatePath("/");
    redirectWithMessage("success", `单元 ${slug} 已退回草稿。`);
  } catch (error) {
    handleActionError(error, `单元 ${slug} 退回草稿失败。`);
  }
}

export async function saveUnitReviewAction(formData: FormData) {
  const slug = getStringField(formData, "slug");
  const reviewedCheckKeys = formData
    .getAll("reviewedCheckKeys")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  try {
    await updateUnitReview(slug, {
      reviewNotes: getStringField(formData, "reviewNotes"),
      reviewedCheckKeys,
    });
    revalidatePath("/");
    redirectWithMessage("success", `单元 ${slug} 审核记录已保存。`);
  } catch (error) {
    handleActionError(error, `单元 ${slug} 审核记录保存失败。`);
  }
}

export async function publishUnitAction(formData: FormData) {
  const slug = getStringField(formData, "slug");

  try {
    await publishUnit(slug);
    revalidatePath("/");
    redirectWithMessage("success", `单元 ${slug} 已发布。`);
  } catch (error) {
    handleActionError(error, `单元 ${slug} 发布失败。`);
  }
}

export async function updatePromptTemplateAction(formData: FormData) {
  const templateId = getStringField(formData, "templateId");
  const appliesToUnitSlugs = getStringField(formData, "appliesToUnitSlugs")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  try {
    await updatePromptTemplate(templateId, {
      status: getStringField(formData, "status") as PromptTemplateStatus,
      description: getStringField(formData, "description"),
      appliesToUnitSlugs,
    });

    revalidatePath("/");
    redirectWithMessage("success", `模板 ${templateId} 已保存。`);
  } catch (error) {
    handleActionError(error, `模板 ${templateId} 保存失败。`);
  }
}

export async function updatePublishingCheckAction(formData: FormData) {
  const checkKey = getStringField(formData, "checkKey");

  try {
    await updatePublishingCheck(checkKey, {
      enabled: getBooleanField(formData, "enabled"),
      required: getBooleanField(formData, "required"),
    });

    revalidatePath("/");
    redirectWithMessage("success", `检查项 ${checkKey} 已保存。`);
  } catch (error) {
    handleActionError(error, `检查项 ${checkKey} 保存失败。`);
  }
}
