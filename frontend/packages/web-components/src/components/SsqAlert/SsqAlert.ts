import { LitElement, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";

import { ssqAlertStyles } from "./SsqAlert.styles";

export type SsqAlertTone = "info" | "success" | "warning" | "error";

const toneLabels: Record<SsqAlertTone, string> = {
  error: "Error",
  info: "Information",
  success: "Success",
  warning: "Warning"
};

export class SsqAlert extends LitElement {
  static styles = [ssqAlertStyles];

  static properties = {
    heading: { type: String },
    tone: { type: String, reflect: true }
  };

  declare heading: string;
  declare tone: SsqAlertTone;

  constructor() {
    super();
    this.heading = "";
    this.tone = "info";
  }

  render() {
    const tone = toneLabels[this.tone] ? this.tone : "info";

    return html`
      <section
        aria-label=${toneLabels[tone]}
        class=${classMap({
          "qld__page-alerts": true,
          "ssq-page-alert": true,
          [`ssq-page-alert--${tone}`]: tone !== "info"
        })}
        role="region"
      >
        ${this.heading ? html`<h2 class="qld__page-alerts--heading ssq-page-alert__heading">${this.heading}</h2>` : nothing}
        <div class="ssq-page-alert__content">
          <slot></slot>
        </div>
      </section>
    `;
  }
}

if (!customElements.get("ssq-alert")) {
  customElements.define("ssq-alert", SsqAlert);
}

declare global {
  interface HTMLElementTagNameMap {
    "ssq-alert": SsqAlert;
  }
}
