import type { ApiAIDiagnoseResponse } from "../../../../../../packages/shared-types/src";
import {
  buildLearningApiErrorResponse,
  getLearningSessionAccessToken,
  requestLearningApiWithToken,
} from "../../../../lib/server-learning-api";

type AskAiRequest = {
  mode: "explain" | "code-map" | "exercise-coach" | "paper-tutor";
  question: string;
  code: string;
  selectedText?: string;
  context?: string;
};

export async function POST(request: Request) {
  const accessToken = await getLearningSessionAccessToken();
  if (!accessToken) {
    return Response.json({ detail: "当前学习会话不存在，请刷新页面重试。" }, { status: 401 });
  }

  const payload = await request.json() as AskAiRequest;
  const aiResponse = await requestLearningApiWithToken("/ai/explain", accessToken, {
    method: "POST",
    body: JSON.stringify({
      mode: payload.mode,
      question: payload.question,
      code: payload.code,
      selected_text: payload.selectedText ?? null,
      context: payload.context ?? null,
    }),
  });

  if (!aiResponse.ok) {
    return buildLearningApiErrorResponse(aiResponse, "AI 助教暂时不可用。");
  }

  return Response.json({
    aiResponse: await aiResponse.json() as ApiAIDiagnoseResponse,
  });
}
