"use client";

import { SsqFormField } from "@ssq/web-components";

import { createSsqWebComponent } from "../createSsqWebComponent";

export const SsqWebFormField = createSsqWebComponent({
  displayName: "SsqWebFormField",
  elementClass: SsqFormField,
  properties: [
    "controlId",
    "disabled",
    "error",
    "hint",
    "label",
    "optional",
    "required"
  ],
  tagName: "ssq-form-field"
});
