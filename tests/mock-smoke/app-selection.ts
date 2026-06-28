export type MockSmokeAppName = "dashboard" | "seniors-card" | "rental-security-subsidy";

export interface MockSmokeApp {
  heading: string;
  name: MockSmokeAppName;
  url: string;
}

export const mockSmokeApps: MockSmokeApp[] = [
  {
    heading: "SSQ Service Dashboard",
    name: "dashboard",
    url: "http://localhost:3300"
  },
  {
    heading: "Seniors Card",
    name: "seniors-card",
    url: "http://localhost:3001"
  },
  {
    heading: "Rental Security Subsidy",
    name: "rental-security-subsidy",
    url: "http://localhost:3002"
  }
];

const mockSmokeAppNames = mockSmokeApps.map((app) => app.name);

function parseSelectedAppNames(value = process.env.SSQ_MOCK_SMOKE_APP ?? "dashboard") {
  const requestedAppNames = value
    .split(",")
    .map((appName) => appName.trim())
    .filter(Boolean);

  if (requestedAppNames.length === 0 || requestedAppNames.includes("all")) {
    return mockSmokeAppNames;
  }

  const invalidAppNames = requestedAppNames.filter((appName) => !mockSmokeAppNames.includes(appName as MockSmokeAppName));

  if (invalidAppNames.length > 0) {
    throw new Error(
      `Unknown SSQ_MOCK_SMOKE_APP value: ${invalidAppNames.join(", ")}. Expected ${mockSmokeAppNames.join(", ")} or all.`
    );
  }

  return requestedAppNames as MockSmokeAppName[];
}

export const selectedMockSmokeAppNames = parseSelectedAppNames();

export const selectedMockSmokeApps = mockSmokeApps.filter((app) => selectedMockSmokeAppNames.includes(app.name));

export function isMockSmokeAppSelected(appName: MockSmokeAppName) {
  return selectedMockSmokeAppNames.includes(appName);
}
