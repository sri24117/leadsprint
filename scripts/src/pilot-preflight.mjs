/**
 * Read-only external check for a managed pilot deployment. It intentionally
 * uses Node's normal certificate verification and never accepts credentials.
 *
 * pnpm pilot:preflight https://leadsprint.example.com
 */
const input = process.argv[2];
let base;
try {
  base = new URL(input);
} catch {
  console.error("Usage: pnpm pilot:preflight https://your-leadsprint-domain");
  process.exit(2);
}

const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(base.hostname);
if ((base.protocol !== "https:" && !(local && base.protocol === "http:")) ||
    base.username || base.password || base.search || base.hash || base.pathname !== "/") {
  console.error("Use a bare HTTPS origin (HTTP is allowed only for localhost), with no credentials or query string.");
  process.exit(2);
}

async function check(path) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
    headers: { accept: "application/json" },
  });
  return response;
}

try {
  const liveness = await check("/api/healthz");
  if (liveness.status !== 200) throw new Error(`/api/healthz returned HTTP ${liveness.status}`);

  const readiness = await check("/api/readyz");
  const state = await readiness.json();
  console.log(`Readiness: HTTP ${readiness.status}; database=${state.database}; auth=${state.auth}; mode=${state.mode}`);
  console.log(`Providers: Retell=${Boolean(state.providers?.retell)} Cal.com=${Boolean(state.providers?.calcom)} intake=${Boolean(state.providers?.intake)} (Twilio optional)`);
  if (readiness.status !== 200 || state.database !== "ok" || state.auth !== "clerk" ||
      state.mode !== "live" || !state.providers?.retell || !state.providers?.calcom || !state.providers?.intake) {
    throw new Error("Pilot configuration is incomplete; inspect /api/readyz and the onboarding checklist.");
  }

  const anonymous = await check("/api/leads");
  if (anonymous.status !== 401 && anonymous.status !== 403) {
    throw new Error(`Unauthenticated /api/leads returned HTTP ${anonymous.status}; expected 401 or 403.`);
  }
  const consolePage = await check("/workspace/leads");
  if (consolePage.status !== 200) throw new Error(`Console deep link returned HTTP ${consolePage.status}`);
  console.log("PASS: HTTPS, database, pilot provider configuration, Clerk mode, anonymous access, and console route.");
  console.log("Next: sign in, complete setup checklist, and run a controlled real call and booking. This check does not contact Retell or Cal.com.");
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
