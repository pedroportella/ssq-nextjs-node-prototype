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
    <nav aria-label={label} className="ssq-progress">
      <ol className="ssq-progress__list">
        {steps.map((step) => (
          <li className={`ssq-progress__step ssq-progress__step--${step.status}`} key={step.id}>
            <span aria-hidden="true" className="ssq-progress__marker" />
            <span className="ssq-progress__content">
              <span aria-current={step.status === "current" ? "step" : undefined} className="ssq-progress__label">
                {step.label}
              </span>
              {step.description ? <span className="ssq-progress__description">{step.description}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
