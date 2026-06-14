import type { ReactNode } from "react";

import "./QhdsProgressIndicator.scss";

export type QhdsProgressStepStatus = "completed" | "current" | "upcoming";

export interface QhdsProgressStep {
  description?: ReactNode;
  id: string;
  label: ReactNode;
  status: QhdsProgressStepStatus;
}

export interface QhdsProgressIndicatorProps {
  label?: string;
  steps: QhdsProgressStep[];
}

export function QhdsProgressIndicator({ label = "Progress", steps }: QhdsProgressIndicatorProps) {
  return (
    <nav aria-label={label} className="qld__progress-indicator ssq-progress">
      <ol className="qld__progress-indicator__list ssq-progress__list">
        {steps.map((step) => {
          const stateClassName = `qld__progress-indicator__item--${step.status}`;

          return (
            <li
              className={`qld__progress-indicator__item ${stateClassName} ssq-progress__step ssq-progress__step--${step.status}`}
              key={step.id}
            >
              <span aria-hidden="true" className="qld__progress-indicator__marker ssq-progress__marker" />
              <span className="qld__progress-indicator__content ssq-progress__content">
                <span
                  aria-current={step.status === "current" ? "step" : undefined}
                  className="qld__progress-indicator__label ssq-progress__label"
                >
                  {step.label}
                </span>
                {step.description ? (
                  <span className="qld__progress-indicator__description ssq-progress__description">{step.description}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
