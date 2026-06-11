import * as React from "react";

type ElementClass<T extends HTMLElement> = {
  new (): T;
};

type EventNames = Record<string, string>;
type EventHandlers<E extends Record<string, Event>> = {
  [K in keyof E]?: (event: E[K]) => void;
};
type WebComponentProps<T extends HTMLElement, E extends Record<string, Event>> = Omit<React.HTMLAttributes<T>, keyof E> &
  Partial<Omit<T, keyof HTMLElement>> &
  EventHandlers<E> & {
    children?: React.ReactNode;
  };

interface SsqWebComponentOptions<T extends HTMLElement, E extends EventNames> {
  displayName: string;
  elementClass: ElementClass<T>;
  events?: E;
  properties: PropertyKey[];
  tagName: string;
}

type EventTypeMap<E extends EventNames> = {
  [K in keyof E]: Event;
};

const passthroughProps = new Set(["children", "className", "id", "slot", "style", "title"]);

export function createSsqWebComponent<T extends HTMLElement, E extends EventNames = {}>({
  displayName,
  events,
  properties,
  tagName
}: SsqWebComponentOptions<T, E>) {
  type Props = WebComponentProps<T, EventTypeMap<E>>;

  const Component = React.forwardRef<T, Props>((componentProps, forwardedRef) => {
    const { children, ...props } = componentProps as Props;
    const elementRef = React.useRef<T | null>(null);

    React.useLayoutEffect(() => {
      const element = elementRef.current;

      if (!element) {
        return undefined;
      }

      properties.forEach((property) => {
        const propertyName = String(property);

        if (propertyName in props) {
          element[property as keyof T] = props[propertyName as keyof typeof props] as unknown as T[keyof T];
        }
      });

      const cleanups = Object.entries(events ?? {}).flatMap(([propName, eventName]) => {
        const listener = props[propName as keyof typeof props];

        if (typeof listener !== "function") {
          return [];
        }

        const eventListener = (event: Event) => listener(event);
        element.addEventListener(eventName, eventListener);

        return [() => element.removeEventListener(eventName, eventListener)];
      });

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    });

    const elementProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => passthroughProps.has(key) || key.startsWith("aria-") || key.startsWith("data-"))
    );

    return React.createElement(tagName, {
      ...elementProps,
      ref: (element: T | null) => {
        elementRef.current = element;

        if (typeof forwardedRef === "function") {
          forwardedRef(element);
        } else if (forwardedRef) {
          forwardedRef.current = element;
        }
      },
      suppressHydrationWarning: true
    }, children);
  });

  Component.displayName = displayName;

  return Component;
}
