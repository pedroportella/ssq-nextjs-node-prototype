import { css } from "lit";
import { ssqFormFieldStyles } from "../SsqFormField/SsqFormField.styles";

export const ssqRadioGroupStyles = [
  ssqFormFieldStyles,
  css`
    .ssq-radio-group {
      border: 0;
      margin: 0 0 var(--ssq-space-6);
      max-width: 42rem;
      padding: 0;
    }

    .ssq-radio-group--disabled {
      opacity: 0.72;
    }

    .ssq-radio-group__legend {
      color: var(--ssq-color-text);
      display: block;
      font-weight: 700;
      margin: 0 0 var(--ssq-space-1);
    }

    .ssq-radio-group__options {
      display: grid;
      gap: var(--ssq-space-3);
      margin-top: var(--ssq-space-3);
    }

    .ssq-radio {
      align-items: flex-start;
      display: grid;
      gap: var(--ssq-space-2);
      grid-template-columns: 1.25rem minmax(0, 1fr);
    }

    .ssq-radio__input {
      accent-color: var(--ssq-color-action);
      height: 1.25rem;
      margin: 0.15rem 0 0;
      width: 1.25rem;
    }

    .ssq-radio__hint {
      color: var(--ssq-color-muted);
      grid-column: 2;
      margin-bottom: 0;
    }
  `
];
