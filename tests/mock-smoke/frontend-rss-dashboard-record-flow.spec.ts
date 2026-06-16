import { expect, test } from "@playwright/test";
import { isMockSmokeAppSelected } from "./app-selection";
import { SsqServiceRecordFlow } from "./helpers/ssqServiceRecordFlow";

if (isMockSmokeAppSelected("dashboard") && isMockSmokeAppSelected("rental-security-subsidy")) {
  test("rental-security-subsidy submits files then dashboard lists the record and file links", async ({ page }, testInfo) => {
    const flow = new SsqServiceRecordFlow(page, "rental-security-subsidy");

    await flow.attachGeneratedData(testInfo);
    await flow.startApplyFromLanding();
    await flow.stageEvidenceFiles();
    await flow.submitAndExpectSubmittedRecord();
    await flow.openDashboardAndExpectSubmittedRecordWithFiles();

    expect(flow.forbiddenRequests).toEqual([]);
  });
}
