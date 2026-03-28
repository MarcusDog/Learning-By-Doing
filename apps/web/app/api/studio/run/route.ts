import type { ApiProgressRecord, ApiRunCodeResponse } from "../../../../../../packages/shared-types/src";
import {
  buildLearningApiErrorResponse,
  fetchCurrentLearnerProfile,
  getLearningSessionAccessToken,
  requestLearningApiWithToken,
} from "../../../../lib/server-learning-api";

type RunWorkspaceRequest = {
  unitSlug: string;
  sourceCode: string;
  stdin?: string;
  completedStepIds: string[];
  notes?: string | null;
  status?: ApiProgressRecord["status"];
};

export async function POST(request: Request) {
  const accessToken = await getLearningSessionAccessToken();
  if (!accessToken) {
    return Response.json({ detail: "当前学习会话不存在，请刷新页面重试。" }, { status: 401 });
  }

  const payload = await request.json() as RunWorkspaceRequest;
  const profile = await fetchCurrentLearnerProfile(accessToken);

  if (!profile) {
    return Response.json({ detail: "当前学习身份不存在，请刷新页面重试。" }, { status: 401 });
  }

  const runResponse = await requestLearningApiWithToken("/run", accessToken, {
    method: "POST",
    body: JSON.stringify({
      source_code: payload.sourceCode,
      stdin: payload.stdin ?? "",
      language: "python",
    }),
  });

  if (!runResponse.ok) {
    return buildLearningApiErrorResponse(runResponse, "代码运行失败。");
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
        code_draft: payload.sourceCode,
        notes: payload.notes ?? null,
      }),
    },
  );

  if (!progressResponse.ok) {
    return buildLearningApiErrorResponse(progressResponse, "进度保存失败。");
  }

  return Response.json({
    runResult: await runResponse.json() as ApiRunCodeResponse,
    progress: await progressResponse.json() as ApiProgressRecord,
  });
}
