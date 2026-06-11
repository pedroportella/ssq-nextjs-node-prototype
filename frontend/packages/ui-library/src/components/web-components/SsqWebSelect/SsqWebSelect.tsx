"use client";

import { SsqSelect } from "@ssq/web-components";

import { createSsqWebComponent } from "../createSsqWebComponent";

export interface SsqWebSelectChangeDetail {
  value: string;
}

export const SsqWebSelect = createSsqWebComponent<SsqSelect, { onSsqChange: "ssq-change" }>({
  displayName: "SsqWebSelect",
  elementClass: SsqSelect,
  events: {
    onSsqChange: "ssq-change"
  },
  properties: [
    "disabled",
    "error",
    "hint",
    "label",
    "name",
    "optional",
    "options",
    "required",
    "value"
  ],
  tagName: "ssq-select"
});
