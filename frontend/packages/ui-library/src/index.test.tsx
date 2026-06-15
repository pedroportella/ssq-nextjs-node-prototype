import { describe, expect, it } from "vitest";

import {
  QhdsButton,
  QhdsCard,
  QhdsCheckbox,
  QhdsCheckboxGroup,
  QhdsContentSection,
  QhdsDirectionLink,
  QhdsFooter,
  QhdsFormField,
  QhdsCol,
  QhdsContainer,
  QhdsRow,
  QhdsIcon,
  QhdsRadioGroup,
  QhdsSelect,
  QhdsSelectInput,
  QhdsTextarea,
  QhdsTextInput,
  QhdsHeader,
  QhdsLayout,
  QhdsPageAlert,
  QhdsPageHeader,
  QhdsSummaryList
} from "./index";

describe("ui-library public exports", () => {
  it("exports app-facing layout and core components", () => {
    expect(QhdsButton).toBeTypeOf("function");
    expect(QhdsCard).toBeTypeOf("function");
    expect(QhdsContentSection).toBeTypeOf("function");
    expect(QhdsDirectionLink).toBeTypeOf("function");
    expect(QhdsFooter).toBeTypeOf("function");
    expect(QhdsCol).toBeTypeOf("function");
    expect(QhdsContainer).toBeTypeOf("function");
    expect(QhdsHeader).toBeTypeOf("function");
    expect(QhdsIcon).toBeTypeOf("function");
    expect(QhdsLayout).toBeTypeOf("function");
    expect(QhdsPageAlert).toBeTypeOf("function");
    expect(QhdsPageHeader).toBeTypeOf("function");
    expect(QhdsRow).toBeTypeOf("function");
    expect(QhdsSummaryList).toBeTypeOf("function");
  });

  it("exports app-facing form components", () => {
    expect(QhdsCheckbox).toBeTypeOf("function");
    expect(QhdsCheckboxGroup).toBeTypeOf("function");
    expect(QhdsFormField).toBeTypeOf("function");
    expect(QhdsRadioGroup).toBeTypeOf("function");
    expect(QhdsSelect).toBeTypeOf("function");
    expect(QhdsSelectInput).toBeTypeOf("function");
    expect(QhdsTextarea).toBeTypeOf("function");
    expect(QhdsTextInput).toBeTypeOf("function");
  });
});
