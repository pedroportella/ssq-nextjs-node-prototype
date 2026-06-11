import { LitElement, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { ssqFormFieldStyles } from "./SsqFormField.styles";

export class SsqFormField extends LitElement {
  static styles = [ssqFormFieldStyles];

  static properties = {
    controlId: { attribute: "control-id", type: String },
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
    hint: { type: String },
    label: { type: String },
    optional: { type: Boolean },
    required: { type: Boolean }
  };

  declare controlId: string;
  declare disabled: boolean;
  declare error: string;
  declare hint: string;
  declare label: string;
  declare optional: boolean;
  declare required: boolean;

  constructor() {
    super();
    this.controlId = "";
    this.disabled = false;
    this.error = "";
    this.hint = "";
    this.label = "";
    this.optional = false;
    this.required = false;
  }

  render() {
    const errorId = this.error && this.controlId ? `${this.controlId}-error` : undefined;
    const hintId = this.hint && this.controlId ? `${this.controlId}-hint` : undefined;

    return html`
      <div
        class=${classMap({
          "qld__form-group": true,
          "ssq-form-field": true,
          "ssq-form-field--disabled": this.disabled,
          "ssq-form-field--invalid": Boolean(this.error)
        })}
      >
        <label class="qld__label ssq-form-field__label" for=${this.controlId}>
          ${this.label}
          ${this.required
            ? html`<span class="ssq-form-field__requirement">required</span>`
            : nothing}
          ${!this.required && this.optional
            ? html`<span class="ssq-form-field__requirement">optional</span>`
            : nothing}
        </label>
        ${this.hint ? html`<p class="qld__hint-text ssq-form-field__hint" id=${ifDefined(hintId)}>${this.hint}</p>` : nothing}
        <slot></slot>
        ${this.error ? html`<p class="qld__input--error ssq-form-field__error" id=${ifDefined(errorId)}>${this.error}</p>` : nothing}
      </div>
    `;
  }
}

if (!customElements.get("ssq-form-field")) {
  customElements.define("ssq-form-field", SsqFormField);
}

declare global {
  interface HTMLElementTagNameMap {
    "ssq-form-field": SsqFormField;
  }
}
