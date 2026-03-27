import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "learning_session";

function getApiBaseUrl() {
  const configuredBaseUrl =
    process.env.LEARNING_API_BASE_URL ??
    process.env.NEXT_PUBLIC_LEARNING_API_BASE_URL ??
    "http://127.0.0.1:8000";

  return configuredBaseUrl.endsWith("/")
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl;
}

export async function proxy(request: NextRequest) {
  if (request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const guestSessionResponse = await fetch(`${getApiBaseUrl()}/auth/guest`, {
    method: "POST",
    cache: "no-store",
  });

  if (!guestSessionResponse.ok) {
    return response;
  }

  const payload = (await guestSessionResponse.json()) as {
    access_token?: string;
  };

  if (payload.access_token) {
    response.cookies.set(SESSION_COOKIE_NAME, payload.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/studio", "/studio/:path*"],
};
