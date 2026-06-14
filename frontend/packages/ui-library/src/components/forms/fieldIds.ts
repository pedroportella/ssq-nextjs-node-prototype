import type { ReactNode } from "react";

export interface QhdsFieldIdsInput {
  controlId: string;
  describedBy?: string;
  error?: ReactNode;
  hint?: ReactNode;
}

export function getQhdsFieldIds({ controlId, describedBy, error, hint }: QhdsFieldIdsInput) {
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedByIds = [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return {
    describedBy: describedByIds,
    errorId,
    hintId
  };
}

export function toSafeControlId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function joinClassNames(...classes: Array<false | null | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
