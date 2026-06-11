"use client";

import { SsqAlert } from "@ssq/web-components";

import { createSsqWebComponent } from "../createSsqWebComponent";

export const SsqWebAlert = createSsqWebComponent({
  displayName: "SsqWebAlert",
  elementClass: SsqAlert,
  properties: ["heading", "tone"],
  tagName: "ssq-alert"
});
