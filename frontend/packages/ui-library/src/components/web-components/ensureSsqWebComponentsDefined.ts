let registration: Promise<unknown> | undefined;

export function ensureSsqWebComponentsDefined() {
  registration ??= import("@ssq/web-components");
  return registration;
}
