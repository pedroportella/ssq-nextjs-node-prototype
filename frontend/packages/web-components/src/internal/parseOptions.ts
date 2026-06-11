export interface SsqOption {
  disabled?: boolean;
  hint?: string;
  label: string;
  value: string;
}

export function parseOptions(value: string | SsqOption[] | undefined): SsqOption[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((option): option is Record<string, unknown> => Boolean(option) && typeof option === "object")
      .map((option) => ({
        disabled: Boolean(option.disabled),
        hint: typeof option.hint === "string" ? option.hint : undefined,
        label: typeof option.label === "string" ? option.label : String(option.value ?? ""),
        value: typeof option.value === "string" ? option.value : String(option.value ?? "")
      }))
      .filter((option) => option.value || option.label);
  } catch {
    return [];
  }
}
