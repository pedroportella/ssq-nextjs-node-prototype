"use client";

import { SsqTextInput } from "@ssq/web-components";

import { createSsqWebComponent } from "../createSsqWebComponent";

export interface SsqWebTextInputValueDetail {
  value: string;
}

export const SsqWebTextInput = createSsqWebComponent<SsqTextInput, { onSsqChange: "ssq-change"; onSsqInput: "ssq-input" }>({
  displayName: "SsqWebTextInput",
  elementClass: SsqTextInput,
  events: {
    onSsqChange: "ssq-change",
    onSsqInput: "ssq-input"
  },
  properties: [
    "disabled",
    "error",
    "hint",
    "inputMode",
    "label",
    "name",
    "optional",
    "placeholder",
    "required",
    "type",
    "value"
  ],
  tagName: "ssq-text-input"
});
