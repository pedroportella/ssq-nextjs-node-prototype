import { LitElement, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { emitSsqEvent } from "../../internal/emitSsqEvent";
import { getFieldIds } from "../../internal/fieldIds";
import { ssqCheckboxStyles } from "./SsqCheckbox.styles";

export class SsqCheckbox extends LitElement {
  static styles = ssqCheckboxStyles;

  static properties = {
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
    hint: { type: String },
    label: { type: String },
    name: { type: String },
    optional: { type: Boolean },
    required: { type: Boolean },
    value: { type: String }
  };

  declare checked: boolean;
  declare disabled: boolean;
  declare error: string;
  declare hint: string;
  declare label: string;
  declare name: string;
  declare optional: boolean;
  declare required: boolean;
  declare value: string;

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.error = "";
    this.hint = "";
    this.label = "";
    this.name = "";
    this.optional = false;
    this.required = false;
    this.value = "on";
  }

  private onChange(event: Event) {
    this.checked = (event.target as HTMLInputElement).checked;
    emitSsqEvent(this, "ssq-change", {
      checked: this.checked,
      value: this.value
    });
  }

  render() {
    const controlId = this.id || "ssq-checkbox";
    const fieldIds = getFieldIds({ error: this.error, hint: this.hint, id: controlId });

    return html`
      <div
        class=${classMap({
          "qld__form-group": true,
          "qld__control-input": true,
          "ssq-checkbox": true,
          "ssq-checkbox--disabled": this.disabled,
          "ssq-checkbox--invalid": Boolean(this.error)
        })}
      >
        <div class="ssq-checkbox__control">
          <input
            aria-describedby=${ifDefined(fieldIds.describedBy)}
            aria-invalid=${this.error ? "true" : "false"}
            class="qld__control-input__input ssq-checkbox__input"
            ?checked=${this.checked}
            ?disabled=${this.disabled}
            id=${controlId}
            name=${this.name || controlId}
            ?required=${this.required}
            type="checkbox"
            value=${this.value}
            @change=${this.onChange}
          />
          <label class="qld__control-input__text ssq-checkbox__label" for=${controlId}>
            ${this.label}
            ${this.required
              ? html`<span class="ssq-form-field__requirement">required</span>`
              : nothing}
            ${!this.required && this.optional
              ? html`<span class="ssq-form-field__requirement">optional</span>`
              : nothing}
          </label>
        </div>
        ${this.hint ? html`<p class="qld__hint-text ssq-form-field__hint ssq-checkbox__hint" id=${ifDefined(fieldIds.hintId)}>${this.hint}</p>` : nothing}
        ${this.error ? html`<p class="qld__input--error ssq-form-field__error ssq-checkbox__error" id=${ifDefined(fieldIds.errorId)}>${this.error}</p>` : nothing}
      </div>
    `;
  }
}

if (!customElements.get("ssq-checkbox")) {
  customElements.define("ssq-checkbox", SsqCheckbox);
}

declare global {
  interface HTMLElementTagNameMap {
    "ssq-checkbox": SsqCheckbox;
  }
}
