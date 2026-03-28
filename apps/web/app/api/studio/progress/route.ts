import type { ApiProgressRecord } from "../../../../../../packages/shared-types/src";
import {
  buildLearningApiErrorResponse,
  fetchCurrentLearnerProfile,
  getLearningSessionAccessToken,
  requestLearningApiWithToken,
} from "../../../../lib/server-learning-api";

type SaveWorkspaceProgressRequest = {
  unitSlug: string;
  codeDraft: string;
  completedStepIds: string[];
  notes?: string | null;
  status?: ApiProgressRecord["status"];
};

export async function POST(request: Request) {
  const accessToken = await getLearningSessionAccessToken();
  if (!accessToken) {
    return Response.json({ detail: "当前学习会话不存在，请刷新页面重试。" }, { status: 401 });
  }

  const payload = await request.json() as SaveWorkspaceProgressRequest;
  const profile = await fetchCurrentLearnerProfile(accessToken);

  if (!profile) {
    return Response.json({ detail: "当前学习身份不存在，请刷新页面重试。" }, { status: 401 });
  }

  const progressResponse = await requestLearningApiWithToken(
    `/progress/${profile.user_id}/${payload.unitSlug}`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({
        user_id: profile.user_id,
        unit_id: payload.unitSlug,
        status: payload.status ?? "in_progress",
        completed_step_ids: payload.completedStepIds,
        code_draft: payload.codeDraft,
        notes: payload.notes ?? null,
      }),
    },
  );

  if (!progressResponse.ok) {
    return buildLearningApiErrorResponse(progressResponse, "进度保存失败。");
  }

  return Response.json({
    progress: await progressResponse.json() as ApiProgressRecord,
  });
}
