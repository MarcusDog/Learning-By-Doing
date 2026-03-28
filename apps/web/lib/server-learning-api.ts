import "server-only";

import { cookies } from "next/headers";

type LearnerProfileResponse = {
  user_id: string;
  name: string;
  email: string;
  plan: "free" | "pro";
};

function getLearningApiBaseUrl() {
  const configuredBaseUrl =
    process.env.LEARNING_API_BASE_URL ??
    process.env.NEXT_PUBLIC_LEARNING_API_BASE_URL ??
    "http://127.0.0.1:8000";

  return configuredBaseUrl.endsWith("/")
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl;
}

export async function getLearningSessionAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("learning_session")?.value ?? null;
}

export async function requestLearningApiWithToken(
  pathname: string,
  accessToken: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${getLearningApiBaseUrl()}${pathname}`, {
    cache: "no-store",
    ...init,
    headers,
  });
}

export async function fetchCurrentLearnerProfile(accessToken: string) {
  const response = await requestLearningApiWithToken("/auth/me", accessToken);
  if (!response.ok) {
    return undefined;
  }

  return await response.json() as LearnerProfileResponse;
}

export async function buildLearningApiErrorResponse(
  response: Response,
  fallbackMessage: string,
) {
  let detail = fallbackMessage;

  try {
    const payload = await response.json() as { detail?: string };
    if (payload.detail) {
      detail = payload.detail;
    }
  } catch {
    detail = fallbackMessage;
  }

  return Response.json({ detail }, { status: response.status });
}
