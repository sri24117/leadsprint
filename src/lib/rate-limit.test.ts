import { describe, it, expect } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test:${crypto.randomUUID()}`;
    const result = rateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks once the limit is exceeded", () => {
    const key = `test:${crypto.randomUUID()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    const third = rateLimit(key, 2, 60_000);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("tracks separate keys independently", () => {
    const keyA = `test:a:${crypto.randomUUID()}`;
    const keyB = `test:b:${crypto.randomUUID()}`;
    rateLimit(keyA, 1, 60_000);
    const resultA = rateLimit(keyA, 1, 60_000);
    const resultB = rateLimit(keyB, 1, 60_000);
    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });
});
