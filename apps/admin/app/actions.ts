"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  seedAdminContent,
  type AdminUnitStatus,
  type PromptTemplateStatus,
  updatePublishingCheck,
  updatePromptTemplate,
  updateUnitStatus,
} from "../lib/admin-data";

function getStringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBooleanField(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function seedContentAction() {
  const result = await seedAdminContent();

  revalidatePath("/");
  redirect(`/?seeded=${result.seeded}&message=${encodeURIComponent("示例内容已重新补种。")}`);
}

export async function updateUnitStatusAction(formData: FormData) {
  const slug = getStringField(formData, "slug");
  const contentStatus = getStringField(formData, "contentStatus");

  await updateUnitStatus(slug, contentStatus as AdminUnitStatus);

  revalidatePath("/");
  redirect(`/?message=${encodeURIComponent(`单元 ${slug} 状态已更新。`)}`);
}

export async function updatePromptTemplateAction(formData: FormData) {
  const templateId = getStringField(formData, "templateId");
  const appliesToUnitSlugs = getStringField(formData, "appliesToUnitSlugs")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  await updatePromptTemplate(templateId, {
    status: getStringField(formData, "status") as PromptTemplateStatus,
    description: getStringField(formData, "description"),
    appliesToUnitSlugs,
  });

  revalidatePath("/");
  redirect(`/?message=${encodeURIComponent(`模板 ${templateId} 已保存。`)}`);
}

export async function updatePublishingCheckAction(formData: FormData) {
  const checkKey = getStringField(formData, "checkKey");

  await updatePublishingCheck(checkKey, {
    enabled: getBooleanField(formData, "enabled"),
    required: getBooleanField(formData, "required"),
  });

  revalidatePath("/");
  redirect(`/?message=${encodeURIComponent(`检查项 ${checkKey} 已保存。`)}`);
}
