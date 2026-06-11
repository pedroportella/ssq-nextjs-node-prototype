"use client";

import { SsqRadioGroup } from "@ssq/web-components";

import { createSsqWebComponent } from "../createSsqWebComponent";

export interface SsqWebRadioGroupChangeDetail {
  value: string;
}

export const SsqWebRadioGroup = createSsqWebComponent<SsqRadioGroup, { onSsqChange: "ssq-change" }>({
  displayName: "SsqWebRadioGroup",
  elementClass: SsqRadioGroup,
  events: {
    onSsqChange: "ssq-change"
  },
  properties: [
    "disabled",
    "error",
    "hint",
    "label",
    "name",
    "options",
    "required",
    "value"
  ],
  tagName: "ssq-radio-group"
});
