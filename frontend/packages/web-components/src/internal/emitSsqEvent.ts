export function emitSsqEvent<TDetail>(
  target: EventTarget,
  type: string,
  detail: TDetail
) {
  return target.dispatchEvent(
    new CustomEvent<TDetail>(type, {
      bubbles: true,
      composed: true,
      detail
    })
  );
}
