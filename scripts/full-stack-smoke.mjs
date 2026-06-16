#!/usr/bin/env node

const DEFAULT_TIMEOUT_MS = 120_000;
const RETRY_DELAY_MS = 2_000;

const endpoints = {
  backendReady: process.env.SSQ_SMOKE_BACKEND_READY_URL ?? "http://localhost:7001/health/ready",
  dashboard: process.env.SSQ_SMOKE_DASHBOARD_URL ?? "http://localhost:3000",
  graphql: process.env.SSQ_SMOKE_GRAPHQL_URL ?? "http://localhost:7001/graphql",
  rentalSecuritySubsidy: process.env.SSQ_SMOKE_RENTAL_SECURITY_SUBSIDY_URL ?? "http://localhost:3002",
  seniorsCard: process.env.SSQ_SMOKE_SENIORS_CARD_URL ?? "http://localhost:3001"
};

const checks = [
  {
    name: "backend readiness",
    run: async () => {
      const payload = await fetchJson(endpoints.backendReady);

      assert(payload.status === "UP", "backend status should be UP");
      assert(payload.checks?.database === "UP", "database readiness should be UP");
    }
  },
  {
    name: "dashboard status",
    run: async () => assertStatus(`${endpoints.dashboard}/status`, "dashboard")
  },
  {
    name: "seniors card status",
    run: async () => assertStatus(`${endpoints.seniorsCard}/status`, "seniors-card")
  },
  {
    name: "rental security subsidy status",
    run: async () => assertStatus(`${endpoints.rentalSecuritySubsidy}/status`, "rental-security-subsidy")
  },
  {
    name: "backend graphql profile",
    run: async () => {
      const payload = await postJson(endpoints.graphql, {
        query: `
          query FullStackSmoke {
            viewer { email givenName familyName }
            transactionCatalogue { definition { key } featureEnabled }
          }
        `
      });

      assert(payload.data?.viewer?.email === "demo.customer@example.test", "viewer should be the seeded demo customer");
      assert(
        payload.data?.transactionCatalogue?.some((entry) => entry.definition?.key === "seniors-card" && entry.featureEnabled),
        "enabled Seniors Card catalogue entry should be returned"
      );
    }
  },
  {
    name: "dashboard backend-rendered page",
    run: async () => {
      const html = await fetchText(endpoints.dashboard);

      assert(html.includes("Taylor Queensland"), "dashboard should render the backend seeded customer");
      assert(html.includes("backend frontend service layer"), "dashboard should render in backend data-source mode");
      assert(!html.includes("Avery Taylor"), "dashboard should not render frontend mock profile data");
    }
  },
  {
    name: "seniors card backend-rendered page",
    run: async () => {
      const html = await fetchText(endpoints.seniorsCard);

      assert(html.includes("Taylor Queensland"), "Seniors Card should render the backend seeded customer");
      assert(html.includes("SSQ-DEMO-0001"), "Seniors Card should render the seeded backend service request");
    }
  },
  {
    name: "rental security subsidy backend-rendered page",
    run: async () => {
      const html = await fetchText(endpoints.rentalSecuritySubsidy);

      assert(html.includes("Taylor Queensland"), "Rental Security Subsidy should render the backend seeded customer");
      assert(html.includes("Rental Security Subsidy"), "Rental Security Subsidy page should render");
    }
  }
];

async function main() {
  const timeoutMs = Number(process.env.SSQ_SMOKE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  for (const check of checks) {
    await waitForCheck(check.name, check.run, timeoutMs);
    console.log(`ok - ${check.name}`);
  }

  console.log("full-stack smoke passed");
}

async function waitForCheck(name, run, timeoutMs) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await run();
      return;
    } catch (error) {
      lastError = error;
      await delay(RETRY_DELAY_MS);
    }
  }

  throw new Error(`${name} failed after ${timeoutMs}ms: ${lastError?.message ?? "unknown error"}`);
}

async function assertStatus(url, appName) {
  const payload = await fetchJson(url);

  assert(payload.app === appName, `${appName} status should identify the app`);
  assert(payload.status === "UP", `${appName} status should be UP`);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    cache: "no-store"
  });

  assert(response.ok, `${url} returned ${response.status}`);

  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": "full-stack-smoke"
    },
    method: "POST"
  });

  assert(response.ok, `${url} returned ${response.status}`);

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    cache: "no-store"
  });

  assert(response.ok, `${url} returned ${response.status}`);

  return response.text();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
