import { LitElement, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";

import { emitSsqEvent } from "../../internal/emitSsqEvent";
import { getFieldIds } from "../../internal/fieldIds";
import { ssqTextInputStyles } from "./SsqTextInput.styles";

export class SsqTextInput extends LitElement {
  static styles = ssqTextInputStyles;

  static properties = {
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
    hint: { type: String },
    inputMode: { attribute: "input-mode", type: String },
    label: { type: String },
    name: { type: String },
    optional: { type: Boolean },
    placeholder: { type: String },
    required: { type: Boolean },
    type: { type: String },
    value: { type: String }
  };

  declare disabled: boolean;
  declare error: string;
  declare hint: string;
  declare inputMode: string;
  declare label: string;
  declare name: string;
  declare optional: boolean;
  declare placeholder: string;
  declare required: boolean;
  declare type: string;
  declare value: string;

  constructor() {
    super();
    this.disabled = false;
    this.error = "";
    this.hint = "";
    this.inputMode = "";
    this.label = "";
    this.name = "";
    this.optional = false;
    this.placeholder = "";
    this.required = false;
    this.type = "text";
    this.value = "";
  }

  private onInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
    emitSsqEvent(this, "ssq-input", { value: this.value });
  }

  private onChange() {
    emitSsqEvent(this, "ssq-change", { value: this.value });
  }

  render() {
    const controlId = this.id || "ssq-text-input";
    const fieldIds = getFieldIds({ error: this.error, hint: this.hint, id: controlId });

    return html`
      <div
        class=${classMap({
          "qld__form-group": true,
          "ssq-form-field": true,
          "ssq-form-field--disabled": this.disabled,
          "ssq-form-field--invalid": Boolean(this.error)
        })}
      >
        <label class="qld__label ssq-form-field__label" for=${controlId}>
          ${this.label}
          ${this.required
            ? html`<span class="ssq-form-field__requirement">required</span>`
            : nothing}
          ${!this.required && this.optional
            ? html`<span class="ssq-form-field__requirement">optional</span>`
            : nothing}
        </label>
        ${this.hint ? html`<p class="qld__hint-text ssq-form-field__hint" id=${fieldIds.hintId}>${this.hint}</p>` : nothing}
        <input
          aria-describedby=${fieldIds.describedBy ?? nothing}
          aria-invalid=${this.error ? "true" : nothing}
          class="qld__text-input ssq-input"
          ?disabled=${this.disabled}
          id=${controlId}
          inputmode=${this.inputMode || nothing}
          name=${this.name || controlId}
          placeholder=${this.placeholder || nothing}
          ?required=${this.required}
          type=${this.type}
          .value=${this.value}
          @change=${this.onChange}
          @input=${this.onInput}
        />
        ${this.error ? html`<p class="qld__input--error ssq-form-field__error" id=${fieldIds.errorId}>${this.error}</p>` : nothing}
      </div>
    `;
  }
}

if (!customElements.get("ssq-text-input")) {
  customElements.define("ssq-text-input", SsqTextInput);
}

declare global {
  interface HTMLElementTagNameMap {
    "ssq-text-input": SsqTextInput;
  }
}
