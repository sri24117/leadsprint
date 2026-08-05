import { createHmac, randomBytes, timingSafeEqual, pbkdf2Sync } from "crypto";

/**
 * Pure crypto/signing primitives, deliberately kept free of any Prisma or
 * Next.js import. `auth.ts` (session lookup, cookie attachment) depends
 * on this module, not the other way round — that split is what lets
 * these functions run in a plain Vitest process without spinning up a
 * Prisma client or a Next.js request context.
 */

export const COOKIE_NAME = "leadsprint_session";
export const SESSION_TTL_SEC = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  workspaceId: string;
  email: string;
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET || "local-dev-change-me-before-production";
}

function b64url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const iterations = 120000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, iterationsRaw, salt, expected] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterationsRaw || !salt || !expected) return false;
  const actual = pbkdf2Sync(password, salt, Number(iterationsRaw), 32, "sha256");
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export function createSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const session: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC
  };
  const encoded = b64url(JSON.stringify(session));
  return `${encoded}.${sign(encoded)}`;
}

export function parseSessionCookie(cookie?: string): SessionPayload | null {
  if (!cookie) return null;
  const [encoded, signature] = cookie.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return null;
  try {
    const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!session.userId || !session.workspaceId || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Twilio request signature validation (see Twilio's "Security" docs for
 * the exact algorithm). Reimplemented by hand instead of pulling in the
 * `twilio` package, since request validation is the only thing that
 * package would be used for here.
 *
 * signature = base64(HMAC-SHA1(authToken, url + sortedParams))
 * where sortedParams is every form key+value concatenated in sorted-key
 * order, no separators — per Twilio's spec.
 */
export function validateTwilioSignature(params: {
  url: string;
  form: Record<string, string>;
  signatureHeader: string | null;
  authToken: string | undefined;
}) {
  const { url, form, signatureHeader, authToken } = params;
  if (!authToken || !signatureHeader) return false;

  const sortedKeys = Object.keys(form).sort();
  const data = sortedKeys.reduce((acc, key) => acc + key + form[key], url);
  const expected = createHmac("sha1", authToken).update(data, "utf8").digest("base64");

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signatureHeader);
  return (
    expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

/** Constant-time shared-secret check for webhooks that don't sign requests (e.g. Bolna). */
export function validateSharedSecret(configured: string | undefined, incoming: string | null) {
  if (!configured || !incoming) return false;
  const expectedBuffer = Buffer.from(configured);
  const actualBuffer = Buffer.from(incoming);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}
