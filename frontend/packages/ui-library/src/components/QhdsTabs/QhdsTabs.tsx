"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import "./QhdsTabs.scss";

export interface QhdsTabItem {
  id: string;
  label: ReactNode;
  panel: ReactNode;
}

export interface QhdsTabsProps {
  defaultSelectedId?: string;
  items: QhdsTabItem[];
  label: string;
}

export function QhdsTabs({ defaultSelectedId, items, label }: QhdsTabsProps) {
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? items[0]?.id);

  function focusTab(itemId: string) {
    document.getElementById(`${itemId}-tab`)?.focus();
  }

  function selectTab(itemId: string) {
    setSelectedId(itemId);
    focusTab(itemId);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const previousIndex = index === 0 ? items.length - 1 : index - 1;
    const nextIndex = index === items.length - 1 ? 0 : index + 1;

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectTab(items[previousIndex].id);
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectTab(items[nextIndex].id);
    }

    if (event.key === "Home") {
      event.preventDefault();
      selectTab(items[0].id);
    }

    if (event.key === "End") {
      event.preventDefault();
      selectTab(items[items.length - 1].id);
    }
  }

  return (
    <div className="ssq-tabs">
      <div aria-label={label} className="ssq-tabs__list" role="tablist">
        {items.map((item, index) => {
          const isSelected = item.id === selectedId;

          return (
            <button
              aria-controls={`${item.id}-tabpanel`}
              aria-selected={isSelected}
              className="ssq-tabs__tab"
              id={`${item.id}-tab`}
              key={item.id}
              onClick={() => selectTab(item.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => {
        const isSelected = item.id === selectedId;

        return (
          <div
            aria-labelledby={`${item.id}-tab`}
            className="ssq-tabs__panel"
            hidden={!isSelected}
            id={`${item.id}-tabpanel`}
            key={item.id}
            role="tabpanel"
            tabIndex={0}
          >
            {item.panel}
          </div>
        );
      })}
    </div>
  );
}
