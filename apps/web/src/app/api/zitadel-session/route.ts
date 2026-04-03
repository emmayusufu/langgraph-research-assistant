import { NextRequest, NextResponse } from "next/server";
import { request as httpRequest } from "http";

const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER!;
const ZITADEL_INTERNAL = process.env.ZITADEL_INTERNAL_URL ?? ZITADEL_ISSUER;
const ZITADEL_HOST = new URL(ZITADEL_ISSUER).host;
const ZITADEL_HOSTNAME = new URL(ZITADEL_INTERNAL).hostname;
const ZITADEL_PORT = parseInt(new URL(ZITADEL_INTERNAL).port || "80");
const LOGIN_CLIENT_TOKEN = process.env.ZITADEL_LOGIN_CLIENT_TOKEN!;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost";

interface ZRes {
  ok: boolean;
  status: number;
  json<T = unknown>(): T;
}

function zFetch(path: string, method: string, token: string, body?: unknown): Promise<ZRes> {
  return new Promise((resolve, reject) => {
    const buf = body ? Buffer.from(JSON.stringify(body)) : undefined;
    const req = httpRequest(
      {
        hostname: ZITADEL_HOSTNAME,
        port: ZITADEL_PORT,
        path,
        method,
        timeout: 5000,
        headers: {
          Host: ZITADEL_HOST,
          Authorization: `Bearer ${token}`,
          ...(buf ? { "Content-Type": "application/json", "Content-Length": buf.length } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString();
          const status = res.statusCode ?? 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            json: <T>() => JSON.parse(text) as T,
          });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(new Error("Zitadel request timed out")); });
    if (buf) req.write(buf);
    req.end();
  });
}

const COOKIE = "zs_token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    if (body.action === "start-session") {
      const loginName = body.loginName as string;
      const res = await zFetch("/v2/sessions", "POST", LOGIN_CLIENT_TOKEN, {
        checks: { user: { loginName } },
      });
      if (!res.ok) {
        const err = res.json<{ message?: string }>();
        return NextResponse.json({ error: err.message ?? "User not found" }, { status: 400 });
      }
      const { sessionId, sessionToken } = res.json<{ sessionId: string; sessionToken: string }>();
      const response = NextResponse.json({ sessionId });
      response.headers.set(
        "Set-Cookie",
        `${COOKIE}=${sessionToken}; HttpOnly; SameSite=Lax; Path=/api/zitadel-session; Max-Age=300`
      );
      return response;
    }

    if (body.action === "authenticate") {
      const { sessionId, authRequestId, password } = body as {
        action: string;
        sessionId: string;
        authRequestId: string;
        password: string;
      };
      const sessionToken = req.cookies.get(COOKIE)?.value;
      if (!sessionToken) {
        return NextResponse.json({ error: "Session expired — please start over" }, { status: 400 });
      }

      const patchRes = await zFetch(`/v2/sessions/${sessionId}`, "PATCH", LOGIN_CLIENT_TOKEN, {
        checks: { password: { password } },
        sessionToken,
      });
      if (!patchRes.ok) {
        const err = patchRes.json<{ message?: string }>();
        return NextResponse.json(
          { error: err.message ?? "Incorrect password" },
          { status: 401 }
        );
      }
      const { sessionToken: updatedToken } = patchRes.json<{ sessionToken: string }>();

      const finalRes = await zFetch(
        `/v2/oidc/auth_requests/${authRequestId}`,
        "POST",
        LOGIN_CLIENT_TOKEN,
        { session: { sessionId, sessionToken: updatedToken } }
      );
      if (!finalRes.ok) {
        const err = finalRes.json<{ message?: string }>();
        return NextResponse.json(
          { error: err.message ?? "Auth finalization failed" },
          { status: 500 }
        );
      }
      const { callbackUrl } = finalRes.json<{ callbackUrl: string }>();

      const expectedOrigin = new URL(NEXTAUTH_URL).origin;
      if (!callbackUrl.startsWith(expectedOrigin)) {
        return NextResponse.json({ error: "Invalid callback URI" }, { status: 500 });
      }

      const response = NextResponse.json({ callbackUri: callbackUrl });
      response.headers.set(
        "Set-Cookie",
        `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/zitadel-session; Max-Age=0`
      );
      return response;
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}
