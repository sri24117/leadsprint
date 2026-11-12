/**
 * Health endpoints.
 *
 * /healthz is liveness: it must answer without touching anything, so a
 * database outage never makes the platform restart a process that is
 * otherwise fine. /readyz is readiness: it reports whether the database the
 * app depends on is actually answering, so an uptime monitor pointed at it
 * sees a database outage instead of a cheerful 200.
 */

import express, { type Express } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../test/testDb";
import healthRouter, { __resetHealthDb, __setHealthDb } from "./health";

function buildApp(): Express {
  const app = express();
  app.use("/api", healthRouter);
  return app;
}

afterEach(() => {
  __resetHealthDb();
  vi.unstubAllEnvs();
});

describe("GET /api/readyz database check", () => {
  it("reports database ok with 200 when the database answers", async () => {
    __setHealthDb(await createTestDb());
    const res = await request(buildApp()).get("/api/readyz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.database).toBe("ok");
    // Existing contract is unchanged.
    expect(res.body.providers).toBeDefined();
    expect(res.body.auth).toBeDefined();
  });

  it("reports a configured Retell and Cal.com pilot as live without optional Twilio", async () => {
    __setHealthDb(await createTestDb());
    for (const [key, value] of Object.entries({
      CLERK_SECRET_KEY: "clerk_test",
      RETELL_API_KEY: "retell_test",
      RETELL_AGENT_ID: "agent_test",
      RETELL_FROM_NUMBER_US: "+12125550100",
      CALCOM_API_KEY: "cal_test",
      CALCOM_EVENT_TYPE_ID: "event_test",
      LEAD_INTAKE_WEBHOOK_SECRET: "intake_test",
    })) vi.stubEnv(key, value);
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("LEADSPRINT_DEMO_AUTH", "false");

    const res = await request(buildApp()).get("/api/readyz");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok", database: "ok", mode: "live", auth: "clerk",
      providers: { retell: true, calcom: true, intake: true, twilio: false },
    });

    vi.stubEnv("LEADSPRINT_DEMO_AUTH", "true");
    vi.stubEnv("NODE_ENV", "development");
    const demo = await request(buildApp()).get("/api/readyz");
    expect(demo.body.mode).toBe("demo");
    expect(demo.body.auth).toBe("demo");
  });

  it("answers 503 degraded when the database query fails, without leaking the driver error", async () => {
    __setHealthDb({
      execute: async () => {
        throw new Error("connect ECONNREFUSED 10.0.0.5:5432 password=hunter2");
      },
    } as never);
    const res = await request(buildApp()).get("/api/readyz");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degraded");
    expect(res.body.database).toBe("unreachable");
    expect(res.body.mode).toBe("demo");
    expect(JSON.stringify(res.body)).not.toContain("hunter2");
    expect(JSON.stringify(res.body)).not.toContain("ECONNREFUSED");
    // Still tells the operator what else is configured.
    expect(res.body.providers).toBeDefined();
  });

  it("answers 503 rather than hanging when the database never responds", async () => {
    vi.stubEnv("READYZ_DB_TIMEOUT_MS", "50");
    __setHealthDb({ execute: () => new Promise(() => {}) } as never);
    const started = Date.now();
    const res = await request(buildApp()).get("/api/readyz");
    expect(res.status).toBe(503);
    expect(res.body.database).toBe("unreachable");
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe("GET /api/healthz", () => {
  it("stays dependency-free: 200 even when the database is down", async () => {
    __setHealthDb({
      execute: async () => {
        throw new Error("database is down");
      },
    } as never);
    const res = await request(buildApp()).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
