interface FieldIdOptions {
  describedBy?: string;
  error?: string;
  hint?: string;
  id: string;
}

export function getFieldIds({ describedBy, error, hint, id }: FieldIdOptions) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return {
    describedBy: [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined,
    errorId,
    hintId
  };
}
