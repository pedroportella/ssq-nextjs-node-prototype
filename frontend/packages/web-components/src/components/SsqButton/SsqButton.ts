import { LitElement, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";

import { emitSsqEvent } from "../../internal/emitSsqEvent";
import { ssqButtonStyles } from "./SsqButton.styles";

export type SsqButtonVariant = "primary" | "secondary";

export class SsqButton extends LitElement {
  static styles = [ssqButtonStyles];

  static properties = {
    disabled: { type: Boolean, reflect: true },
    href: { type: String },
    type: { type: String },
    variant: { type: String, reflect: true }
  };

  declare disabled: boolean;
  declare href: string;
  declare type: "button" | "submit" | "reset";
  declare variant: SsqButtonVariant;

  constructor() {
    super();
    this.disabled = false;
    this.href = "";
    this.type = "button";
    this.variant = "primary";
  }

  private get classes() {
    return {
      "qld__btn": true,
      "qld__btn--primary": this.variant === "primary",
      "qld__btn--secondary": this.variant === "secondary",
      "ssq-button": true,
      "ssq-button--primary": this.variant === "primary",
      "ssq-button--secondary": this.variant === "secondary"
    };
  }

  private onClick(event: MouseEvent) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    emitSsqEvent(this, "ssq-click", {
      href: this.href || undefined,
      variant: this.variant
    });
  }

  render() {
    if (this.href) {
      return html`
        <a
          aria-disabled=${this.disabled ? "true" : "false"}
          class=${classMap(this.classes)}
          href=${this.disabled ? nothing : this.href}
          role="button"
          tabindex=${this.disabled ? "-1" : "0"}
          @click=${this.onClick}
        >
          <slot></slot>
        </a>
      `;
    }

    return html`
      <button
        class=${classMap(this.classes)}
        ?disabled=${this.disabled}
        type=${this.type}
        @click=${this.onClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get("ssq-button")) {
  customElements.define("ssq-button", SsqButton);
}

declare global {
  interface HTMLElementTagNameMap {
    "ssq-button": SsqButton;
  }
}
