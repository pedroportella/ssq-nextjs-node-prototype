import { expect, test } from "@playwright/test";
import { isMockSmokeAppSelected } from "../mock-smoke/app-selection";
import { generateBttfSsqApplicantData } from "../mock-smoke/helpers/bttfSsqData";
import { SsqServiceRecordFlow } from "../mock-smoke/helpers/ssqServiceRecordFlow";
import { uploadValidationScenarios, workflowScenarios } from "./serviceScenarioMatrix";

for (const scenario of workflowScenarios) {
  if (!isMockSmokeAppSelected(scenario.app)) {
    continue;
  }

  test(scenario.label, async ({ page }, testInfo) => {
    const flow = new SsqServiceRecordFlow(
      page,
      scenario.app,
      generateBttfSsqApplicantData(scenario.app, { scenarioId: scenario.id })
    );

    await flow.attachGeneratedData(testInfo);
    await flow.startApplyFromLanding();
    await flow.completeWorkflowFields(scenario.fields);
    await flow.expectVisibleValidationMessages(scenario.expectedValidationMessages);

    if (scenario.withFiles) {
      await flow.stageEvidenceFiles();
    }

    if (scenario.submitMode === "submit") {
      await flow.submitAndExpectSubmittedRecord();
    } else {
      await flow.stopBeforeSubmit();
    }

    if (scenario.summaryDownload) {
      await flow.expectSummaryDownload();
    }

    if (scenario.dashboardLookup) {
      await flow.openDashboardAndExpectSubmittedRecordWithFiles();
    }

    expect(flow.forbiddenRequests).toEqual([]);
  });
}

for (const scenario of uploadValidationScenarios) {
  if (!isMockSmokeAppSelected(scenario.app)) {
    continue;
  }

  test(scenario.label, async ({ page }, testInfo) => {
    const flow = new SsqServiceRecordFlow(
      page,
      scenario.app,
      generateBttfSsqApplicantData(scenario.app, { scenarioId: scenario.id })
    );

    await flow.attachGeneratedData(testInfo);
    await flow.startApply();
    await flow.stageValidationFiles(scenario.inputSelector, scenario.files);

    for (const category of scenario.categories ?? []) {
      const categorySelects = page.getByLabel(`Category for ${category.fileName}`);
      const count = await categorySelects.count();

      for (let index = 0; index < count; index += 1) {
        await categorySelects.nth(index).selectOption(category.category);
        await expect(categorySelects.nth(index)).toHaveValue(category.category);
      }
    }

    await flow.expectUploadValidationMessages(scenario.expectedMessages);
    expect(flow.forbiddenRequests).toEqual([]);
  });
}
