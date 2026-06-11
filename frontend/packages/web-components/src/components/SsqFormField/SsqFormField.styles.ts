import { css } from "lit";

export const ssqFormFieldStyles = css`
  :host {
    display: block;
  }

  .ssq-form-field {
    border: 0;
    color: var(--ssq-color-text);
    margin: 0 0 var(--ssq-space-6);
    max-width: 42rem;
    padding: 0;
  }

  .ssq-form-field--disabled {
    opacity: 0.72;
  }

  .ssq-form-field__label {
    color: var(--ssq-color-text);
    display: block;
    font-weight: 700;
    margin: 0 0 var(--ssq-space-1);
  }

  .ssq-form-field__requirement {
    color: var(--ssq-color-muted);
    display: block;
    font-size: 0.875rem;
    font-weight: 400;
  }

  .ssq-form-field__hint {
    color: var(--ssq-color-muted);
    margin: 0 0 var(--ssq-space-2);
  }

  .ssq-form-field__error {
    color: var(--ssq-color-error);
    font-weight: 700;
    margin: var(--ssq-space-2) 0 0;
  }
`;
