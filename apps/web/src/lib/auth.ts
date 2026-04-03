import { jwtDecode } from "jwt-decode";
import { request as httpRequest } from "http";
import { NextAuthOptions } from "next-auth";
import { OAuthConfig } from "next-auth/providers";
import { JWT } from "next-auth/jwt";

const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER!;
const ZITADEL_INTERNAL = process.env.ZITADEL_INTERNAL_URL ?? ZITADEL_ISSUER;

// "localhost:8085" — the Host header Zitadel expects for instance routing
const ZITADEL_HOST = new URL(ZITADEL_ISSUER).host;
const ZITADEL_HOSTNAME = new URL(ZITADEL_INTERNAL).hostname;
const ZITADEL_PORT = parseInt(new URL(ZITADEL_INTERNAL).port || "80");

interface ZResponse {
  ok: boolean;
  status: number;
  json<T>(): T;
}

// node http.request with the correct Host header so Zitadel routes to the right instance
function zFetch(path: string, method: string, headers: Record<string, string | number>, body?: string): Promise<ZResponse> {
  return new Promise((resolve, reject) => {
    const buf = body ? Buffer.from(body) : undefined;
    const req = httpRequest(
      {
        hostname: ZITADEL_HOSTNAME,
        port: ZITADEL_PORT,
        path,
        method,
        headers: { Host: ZITADEL_HOST, ...headers, ...(buf ? { "Content-Length": buf.length } : {}) },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString();
          const status = res.statusCode ?? 0;
          resolve({ ok: status >= 200 && status < 300, status, json: <T>() => JSON.parse(text) as T });
        });
      }
    );
    req.on("error", reject);
    if (buf) req.write(buf);
    req.end();
  });
}

function zitadelProvider(): OAuthConfig<Record<string, unknown>> {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/zitadel`;

  return {
    id: "zitadel",
    name: "ZITADEL",
    type: "oauth",
    version: "2.0",
    checks: ["pkce", "state"],
    idToken: false,
    issuer: ZITADEL_ISSUER,
    authorization: {
      url: `${ZITADEL_ISSUER}/oauth/v2/authorize`,
      params: { scope: "openid email profile offline_access urn:zitadel:iam:org:id" },
    },
    token: {
      url: `${ZITADEL_INTERNAL}/oauth/v2/token`,
      async request(context) {
        const body = new URLSearchParams({
          grant_type: "authorization_code",
          code: context.params.code as string,
          redirect_uri: redirectUri,
          code_verifier: context.checks.code_verifier as string,
        }).toString();
        const creds = Buffer.from(`${context.provider.clientId}:${context.provider.clientSecret}`).toString("base64");
        const res = await zFetch("/oauth/v2/token", "POST", {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${creds}`,
        }, body);
        if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${JSON.stringify(res.json())}`);
        return { tokens: res.json<Record<string, unknown>>() as Parameters<typeof context.client.callback>[2] };
      },
    },
    userinfo: {
      url: `${ZITADEL_INTERNAL}/oidc/v1/userinfo`,
      async request(context) {
        const res = await zFetch("/oidc/v1/userinfo", "GET", {
          Authorization: `Bearer ${context.tokens.access_token}`,
        });
        if (!res.ok) throw new Error(`Userinfo failed (${res.status})`);
        return res.json<Record<string, unknown>>();
      },
    },
    clientId: process.env.ZITADEL_CLIENT_ID!,
    clientSecret: process.env.ZITADEL_CLIENT_SECRET!,
    profile(profile) {
      return {
        id: profile.sub as string,
        name:
          [profile.given_name, profile.family_name].filter(Boolean).join(" ") ||
          (profile.name as string | undefined) ||
          "",
        email: profile.email as string,
      };
    },
  };
}

export async function refreshAccessToken(token: JWT): Promise<JWT> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.ZITADEL_CLIENT_ID!,
    client_secret: process.env.ZITADEL_CLIENT_SECRET!,
    refresh_token: token.refreshToken,
  }).toString();
  const res = await zFetch("/oauth/v2/token", "POST", {
    "Content-Type": "application/x-www-form-urlencoded",
  }, body);
  const data = res.json<Record<string, unknown>>();
  if (!res.ok) throw data;
  return {
    ...token,
    accessToken: data.access_token as string,
    refreshToken: (data.refresh_token ?? token.refreshToken) as string,
    accessTokenExpires: Date.now() + (data.expires_in as number) * 1000,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [zitadelProvider()],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        if (!account.access_token || !account.refresh_token || !account.expires_at) return token;
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at * 1000,
          orgId:
            (profile as Record<string, unknown> | undefined)?.["urn:zitadel:iam:org:id"] as string ?? "",
        };
      }
      if (Date.now() < token.accessTokenExpires) return token;
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.orgId = token.orgId;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (!token?.accessToken) return;
      const decoded = jwtDecode<{ jti?: string; exp?: number }>(token.accessToken);
      if (!decoded.jti || !decoded.exp) return;
      await fetch(`${process.env.OPA_URL}/v1/data/revoked_tokens`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json-patch+json" },
        body: JSON.stringify([{ op: "add", path: `/${decoded.jti}`, value: decoded.exp }]),
      }).catch((err) => console.error("OPA token revocation failed:", err));
    },
  },
};
