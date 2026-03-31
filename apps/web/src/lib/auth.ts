import { jwtDecode } from "jwt-decode";
import { NextAuthOptions } from "next-auth";
import ZitadelProvider from "next-auth/providers/zitadel";
import { JWT } from "next-auth/jwt";

export async function refreshAccessToken(token: JWT): Promise<JWT> {
  const res = await fetch(`${process.env.ZITADEL_ISSUER}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ZITADEL_CLIENT_ID!,
      client_secret: process.env.ZITADEL_CLIENT_SECRET!,
      refresh_token: token.refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return {
    ...token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? token.refreshToken,
    accessTokenExpires: Date.now() + data.expires_in * 1000,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    ZitadelProvider({
      issuer: process.env.ZITADEL_ISSUER!,
      clientId: process.env.ZITADEL_CLIENT_ID!,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile offline_access urn:zitadel:iam:org:id",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        if (!account.access_token || !account.refresh_token || !account.expires_at) {
          return token;
        }
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at * 1000,
          orgId: (profile as Record<string, unknown> | undefined)?.["urn:zitadel:iam:org:id"] as string ?? "",
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
        body: JSON.stringify([
          { op: "add", path: `/${decoded.jti}`, value: decoded.exp },
        ]),
      }).catch((err) => {
        console.error("OPA token revocation failed:", err);
      });
    },
  },
};
