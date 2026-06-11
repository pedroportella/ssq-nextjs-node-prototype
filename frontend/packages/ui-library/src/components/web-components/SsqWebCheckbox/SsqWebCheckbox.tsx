"use client";

import { SsqCheckbox } from "@ssq/web-components";

import { createSsqWebComponent } from "../createSsqWebComponent";

export interface SsqWebCheckboxChangeDetail {
  checked: boolean;
  value: string;
}

export const SsqWebCheckbox = createSsqWebComponent<SsqCheckbox, { onSsqChange: "ssq-change" }>({
  displayName: "SsqWebCheckbox",
  elementClass: SsqCheckbox,
  events: {
    onSsqChange: "ssq-change"
  },
  properties: [
    "checked",
    "disabled",
    "error",
    "hint",
    "label",
    "name",
    "optional",
    "required",
    "value"
  ],
  tagName: "ssq-checkbox"
});
