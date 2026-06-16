import { test } from "@playwright/test";
import { isMockSmokeAppSelected } from "./app-selection";
import { SsqServiceRecordFlow, type SsqRecordSubmitMode } from "./helpers/ssqServiceRecordFlow";

const submitModes: { label: string; mode: SsqRecordSubmitMode }[] = [
  { label: "stops before submit with staged files", mode: "stop-before-submit" },
  { label: "submits a mock record with staged files", mode: "submit" }
];

if (isMockSmokeAppSelected("seniors-card")) {
  for (const scenario of submitModes) {
    test(`seniors-card ${scenario.label}`, async ({ page }, testInfo) => {
      const flow = new SsqServiceRecordFlow(page, "seniors-card");

      await flow.run({
        submitMode: scenario.mode,
        testInfo,
        withFiles: true
      });
    });
  }
}

if (isMockSmokeAppSelected("rental-security-subsidy")) {
  for (const scenario of submitModes) {
    test(`rental-security-subsidy ${scenario.label}`, async ({ page }, testInfo) => {
      const flow = new SsqServiceRecordFlow(page, "rental-security-subsidy");

      await flow.run({
        submitMode: scenario.mode,
        testInfo,
        withFiles: true
      });
    });
  }
}
