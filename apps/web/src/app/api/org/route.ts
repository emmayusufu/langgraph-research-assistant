import { NextRequest, NextResponse } from "next/server";
import { createPrivateKey, createSign } from "crypto";
import { request as httpRequest } from "http";
import { URL } from "url";
import { Pool } from "pg";

const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER!;
const ZITADEL_URL = process.env.ZITADEL_INTERNAL_URL ?? ZITADEL_ISSUER;
const ZITADEL_HOST = new URL(ZITADEL_ISSUER).host;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

function zPost(
  path: string,
  token: string,
  body: string,
  extra: Record<string, string> = {}
): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(`${ZITADEL_URL}${path}`);
    const req = httpRequest(
      {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname,
        method: "POST",
        headers: {
          Host: ZITADEL_HOST,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...extra,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString();
          resolve({
            ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
            status: res.statusCode ?? 0,
            json: () => Promise.resolve(JSON.parse(text)),
          });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function getMachineToken(): Promise<string> {
  const keyData = JSON.parse(process.env.ZITADEL_MACHINE_KEY!);
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: keyData.keyId })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: keyData.userId,
      sub: keyData.userId,
      aud: ZITADEL_ISSUER,
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(createPrivateKey(keyData.key), "base64url");
  const jwt = `${header}.${payload}.${sig}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    scope: [
      "openid",
      `urn:zitadel:iam:org:domain:primary:${new URL(ZITADEL_ISSUER).hostname}`,
      "urn:zitadel:iam:permission:admin",
      "urn:zitadel:iam:org:project:id:zitadel:aud",
    ].join(" "),
    assertion: jwt,
  }).toString();

  return new Promise((resolve, reject) => {
    const parsed = new URL(`${ZITADEL_URL}/oauth/v2/token`);
    const req = httpRequest(
      {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname,
        method: "POST",
        headers: {
          Host: ZITADEL_HOST,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const data = JSON.parse(Buffer.concat(chunks).toString()) as {
            access_token?: string;
          };
          if (!data.access_token)
            reject(new Error(`Machine token exchange failed: ${JSON.stringify(data)}`));
          else resolve(data.access_token);
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { orgName, firstName, lastName, email, password } = await req.json();
    const token = await getMachineToken();

    const orgRes = await zPost("/management/v1/orgs", token, JSON.stringify({ name: orgName }));
    if (!orgRes.ok) {
      const err = await orgRes.json() as { message?: string };
      return NextResponse.json(
        { error: err.message ?? "Failed to create organization" },
        { status: 400 }
      );
    }
    const { id: orgId } = await orgRes.json() as { id: string };

    const userRes = await zPost(
      "/management/v1/users/human",
      token,
      JSON.stringify({
        userName: email,
        profile: { firstName, lastName },
        email: { email, isEmailVerified: false },
        password: { password, changeRequired: false },
      }),
      { "x-zitadel-orgid": orgId }
    );
    if (!userRes.ok) {
      const err = await userRes.json() as { message?: string };
      return NextResponse.json(
        { error: err.message ?? "Failed to create user" },
        { status: 400 }
      );
    }
    const { userId } = await userRes.json() as { userId: string };

    await db.query(
      `INSERT INTO user_profiles (zitadel_user_id, display_name)
       VALUES ($1, $2)
       ON CONFLICT (zitadel_user_id) DO NOTHING`,
      [userId, `${firstName} ${lastName}`.trim()]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
