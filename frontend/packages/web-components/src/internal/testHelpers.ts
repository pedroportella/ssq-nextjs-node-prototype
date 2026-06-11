import type { LitElement } from "lit";

export async function fixture<TElement extends HTMLElement>(element: TElement) {
  document.body.replaceChildren(element);

  const maybeLitElement = element as TElement & Partial<LitElement>;
  if (maybeLitElement.updateComplete) {
    await maybeLitElement.updateComplete;
  }

  return element;
}

export async function nextRender(element: HTMLElement) {
  const maybeLitElement = element as HTMLElement & Partial<LitElement>;
  if (maybeLitElement.updateComplete) {
    await maybeLitElement.updateComplete;
  }
}
