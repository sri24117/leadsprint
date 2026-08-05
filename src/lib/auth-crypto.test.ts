import { describe, it, expect, beforeEach } from "vitest";
import { createHmac } from "crypto";
import {
  hashPassword,
  verifyPassword,
  createSessionCookie,
  parseSessionCookie,
  validateTwilioSignature,
  validateSharedSecret
} from "./auth-crypto";

describe("password hashing", () => {
  it("verifies a correct password", () => {
    const stored = hashPassword("correct-horse-battery-staple");
    expect(verifyPassword("correct-horse-battery-staple", stored)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const stored = hashPassword("correct-horse-battery-staple");
    expect(verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("produces a different hash each time (random salt)", () => {
    const a = hashPassword("same-password");
    const b = hashPassword("same-password");
    expect(a).not.toBe(b);
  });

  it("rejects malformed stored hashes instead of throwing", () => {
    expect(verifyPassword("anything", "not-a-valid-hash")).toBe(false);
  });
});

describe("session cookie", () => {
  it("round-trips a valid session", () => {
    const cookie = createSessionCookie({ userId: "u1", workspaceId: "w1", email: "a@b.com" });
    const parsed = parseSessionCookie(cookie);
    expect(parsed?.userId).toBe("u1");
    expect(parsed?.workspaceId).toBe("w1");
  });

  it("rejects a tampered payload", () => {
    const cookie = createSessionCookie({ userId: "u1", workspaceId: "w1", email: "a@b.com" });
    const [encoded, signature] = cookie.split(".");
    const tampered = `${Buffer.from(JSON.stringify({ userId: "attacker", workspaceId: "w1", email: "a@b.com", exp: 9999999999 })).toString("base64url")}.${signature}`;
    expect(parseSessionCookie(tampered)).toBeNull();
  });

  it("rejects a missing cookie", () => {
    expect(parseSessionCookie(undefined)).toBeNull();
  });

  it("rejects garbage input without throwing", () => {
    expect(parseSessionCookie("not.a.real.cookie")).toBeNull();
  });
});

describe("validateTwilioSignature", () => {
  const authToken = "test-auth-token";
  const url = "https://example.com/api/webhooks/twilio/voice";
  const form = { To: "+15551234567", From: "+15557654321", CallSid: "CA123" };

  function realTwilioSignature() {
    const sortedKeys = Object.keys(form).sort();
    const data = sortedKeys.reduce((acc, key) => acc + key + (form as any)[key], url);
    return createHmac("sha1", authToken).update(data, "utf8").digest("base64");
  }

  it("accepts a correctly signed request", () => {
    const signature = realTwilioSignature();
    expect(validateTwilioSignature({ url, form, signatureHeader: signature, authToken })).toBe(true);
  });

  it("rejects a request with a wrong signature", () => {
    expect(
      validateTwilioSignature({ url, form, signatureHeader: "bogus-signature", authToken })
    ).toBe(false);
  });

  it("rejects when auth token is missing", () => {
    const signature = realTwilioSignature();
    expect(
      validateTwilioSignature({ url, form, signatureHeader: signature, authToken: undefined })
    ).toBe(false);
  });

  it("rejects when signature header is missing", () => {
    expect(validateTwilioSignature({ url, form, signatureHeader: null, authToken })).toBe(false);
  });

  it("rejects if the form body was tampered with after signing", () => {
    const signature = realTwilioSignature();
    const tamperedForm = { ...form, To: "+19998887777" };
    expect(
      validateTwilioSignature({ url, form: tamperedForm, signatureHeader: signature, authToken })
    ).toBe(false);
  });
});

describe("validateSharedSecret", () => {
  it("accepts a matching secret", () => {
    expect(validateSharedSecret("my-secret", "my-secret")).toBe(true);
  });

  it("rejects a non-matching secret", () => {
    expect(validateSharedSecret("my-secret", "wrong-secret")).toBe(false);
  });

  it("rejects when nothing is configured (fail closed, not open)", () => {
    expect(validateSharedSecret(undefined, "anything")).toBe(false);
  });

  it("rejects when no header was sent", () => {
    expect(validateSharedSecret("my-secret", null)).toBe(false);
  });
});
