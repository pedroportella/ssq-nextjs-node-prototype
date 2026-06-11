import { LitElement, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { emitSsqEvent } from "../../internal/emitSsqEvent";
import { getFieldIds } from "../../internal/fieldIds";
import { parseOptions, type SsqOption } from "../../internal/parseOptions";
import { ssqSelectStyles } from "./SsqSelect.styles";

export class SsqSelect extends LitElement {
  static styles = ssqSelectStyles;

  static properties = {
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
    hint: { type: String },
    label: { type: String },
    name: { type: String },
    optional: { type: Boolean },
    options: { type: Array },
    required: { type: Boolean },
    value: { type: String }
  };

  declare disabled: boolean;
  declare error: string;
  declare hint: string;
  declare label: string;
  declare name: string;
  declare optional: boolean;
  declare options: SsqOption[] | string;
  declare required: boolean;
  declare value: string;

  constructor() {
    super();
    this.disabled = false;
    this.error = "";
    this.hint = "";
    this.label = "";
    this.name = "";
    this.optional = false;
    this.options = [];
    this.required = false;
    this.value = "";
  }

  private onChange(event: Event) {
    this.value = (event.target as HTMLSelectElement).value;
    emitSsqEvent(this, "ssq-change", { value: this.value });
  }

  render() {
    const controlId = this.id || "ssq-select";
    const fieldIds = getFieldIds({ error: this.error, hint: this.hint, id: controlId });
    const options = parseOptions(this.options);

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
        ${this.hint ? html`<p class="qld__hint-text ssq-form-field__hint" id=${ifDefined(fieldIds.hintId)}>${this.hint}</p>` : nothing}
        <select
          aria-describedby=${ifDefined(fieldIds.describedBy)}
          aria-invalid=${this.error ? "true" : "false"}
          class="qld__select-control ssq-select"
          ?disabled=${this.disabled}
          id=${controlId}
          name=${this.name || controlId}
          ?required=${this.required}
          .value=${this.value}
          @change=${this.onChange}
        >
          ${options.map(
            (option) => html`
              <option ?disabled=${option.disabled} value=${option.value}>${option.label}</option>
            `
          )}
        </select>
        ${this.error ? html`<p class="qld__input--error ssq-form-field__error" id=${ifDefined(fieldIds.errorId)}>${this.error}</p>` : nothing}
      </div>
    `;
  }
}

if (!customElements.get("ssq-select")) {
  customElements.define("ssq-select", SsqSelect);
}

declare global {
  interface HTMLElementTagNameMap {
    "ssq-select": SsqSelect;
  }
}
