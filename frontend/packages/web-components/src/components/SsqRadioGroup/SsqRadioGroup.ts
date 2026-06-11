import { LitElement, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { emitSsqEvent } from "../../internal/emitSsqEvent";
import { getFieldIds } from "../../internal/fieldIds";
import { parseOptions, type SsqOption } from "../../internal/parseOptions";
import { ssqRadioGroupStyles } from "./SsqRadioGroup.styles";

export class SsqRadioGroup extends LitElement {
  static styles = ssqRadioGroupStyles;

  static properties = {
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
    hint: { type: String },
    label: { type: String },
    name: { type: String },
    options: { type: Array },
    required: { type: Boolean },
    value: { type: String }
  };

  declare disabled: boolean;
  declare error: string;
  declare hint: string;
  declare label: string;
  declare name: string;
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
    this.options = [];
    this.required = false;
    this.value = "";
  }

  private onChange(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
    emitSsqEvent(this, "ssq-change", { value: this.value });
  }

  render() {
    const groupId = this.id || "ssq-radio-group";
    const fieldIds = getFieldIds({ error: this.error, hint: this.hint, id: groupId });
    const options = parseOptions(this.options);
    const name = this.name || groupId;

    return html`
      <fieldset
        aria-describedby=${ifDefined(fieldIds.describedBy)}
        class=${classMap({
          "qld__form-group": true,
          "ssq-radio-group": true,
          "ssq-radio-group--disabled": this.disabled,
          "ssq-radio-group--invalid": Boolean(this.error)
        })}
      >
        <legend class="qld__label ssq-radio-group__legend">
          ${this.label}
          ${this.required ? html`<span class="ssq-form-field__requirement">required</span>` : nothing}
        </legend>
        ${this.hint ? html`<p class="qld__hint-text ssq-form-field__hint" id=${ifDefined(fieldIds.hintId)}>${this.hint}</p>` : nothing}
        <div class="ssq-radio-group__options">
          ${options.map((option, index) => {
            const optionId = `${groupId}-${index + 1}`;

            return html`
              <div class="qld__control-input ssq-radio">
                <input
                  aria-invalid=${this.error ? "true" : "false"}
                  class="qld__control-input__input ssq-radio__input"
                  ?checked=${this.value === option.value}
                  ?disabled=${this.disabled || option.disabled}
                  id=${optionId}
                  name=${name}
                  ?required=${this.required}
                  type="radio"
                  value=${option.value}
                  @change=${this.onChange}
                />
                <label class="qld__control-input__text" for=${optionId}>${option.label}</label>
                ${option.hint ? html`<p class="ssq-radio__hint">${option.hint}</p>` : nothing}
              </div>
            `;
          })}
        </div>
        ${this.error ? html`<p class="qld__input--error ssq-form-field__error" id=${ifDefined(fieldIds.errorId)}>${this.error}</p>` : nothing}
      </fieldset>
    `;
  }
}

if (!customElements.get("ssq-radio-group")) {
  customElements.define("ssq-radio-group", SsqRadioGroup);
}

declare global {
  interface HTMLElementTagNameMap {
    "ssq-radio-group": SsqRadioGroup;
  }
}
