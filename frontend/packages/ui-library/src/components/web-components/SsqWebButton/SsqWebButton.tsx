"use client";

import { SsqButton } from "@ssq/web-components";

import { createSsqWebComponent } from "../createSsqWebComponent";

export interface SsqWebButtonClickDetail {
  href?: string;
  variant: "primary" | "secondary";
}

export const SsqWebButton = createSsqWebComponent<SsqButton, { onSsqClick: "ssq-click" }>({
  displayName: "SsqWebButton",
  elementClass: SsqButton,
  events: {
    onSsqClick: "ssq-click"
  },
  properties: ["disabled", "href", "type", "variant"],
  tagName: "ssq-button"
});
