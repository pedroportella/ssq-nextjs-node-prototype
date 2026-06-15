import type { MouseEvent, ReactNode } from "react";

import { QhdsIcon } from "../QhdsIcon";

import "./QhdsSideNav.scss";

export interface QhdsSideNavItem {
  badge?: ReactNode;
  expanded?: boolean;
  href: string;
  icon?: ReactNode;
  id?: string;
  items?: QhdsSideNavItem[];
  label: ReactNode;
}

export interface QhdsSideNavProps {
  activeHref?: string;
  ariaLabel?: string;
  headingHref?: string;
  headingIcon?: ReactNode;
  heading?: ReactNode;
  id?: string;
  items: QhdsSideNavItem[];
  navId?: string;
  onNavigate?: (href: string) => void;
}

function containsActiveItem(item: QhdsSideNavItem, activeHref?: string): boolean {
  return Boolean(activeHref && (item.href === activeHref || item.items?.some((child) => containsActiveItem(child, activeHref))));
}

function getPlainLabel(label: ReactNode, fallback: string): string {
  if (typeof label === "string" || typeof label === "number") {
    return String(label);
  }

  return fallback;
}

function slugify(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

export function QhdsSideNav({
  activeHref,
  ariaLabel = "left navigation",
  heading,
  headingHref,
  headingIcon,
  id,
  items,
  navId = "left-nav",
  onNavigate
}: QhdsSideNavProps) {
  function getNavigationProps(href: string) {
    if (!onNavigate) {
      return {};
    }

    return {
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        onNavigate(href);
      }
    };
  }

  function renderLinkContent(item: QhdsSideNavItem) {
    return (
      <>
        {item.icon ? <span className="qld__left-nav__item-icon">{item.icon}</span> : null}
        <span className="qld__left-nav__item-text">{item.label}</span>
        {item.badge ? <span className="ssq-side-nav__badge">{item.badge}</span> : null}
      </>
    );
  }

  function renderItem(item: QhdsSideNavItem, index: number, parentKey: string) {
    const childItems = item.items ?? [];
    const hasChildren = childItems.length > 0;
    const current = Boolean(activeHref && item.href === activeHref);
    const childIsActive = childItems.some((child) => containsActiveItem(child, activeHref));
    const expanded = hasChildren ? item.expanded ?? (current || childIsActive) : false;
    const key = item.id ?? item.href;
    const itemId = `${navId}-${slugify(item.id ?? item.href ?? `${parentKey}-${index}`)}`;
    const childListId = `${itemId}-children`;
    const linkClasses = ["qld__left-nav__item-link", hasChildren && expanded ? "qld__left-nav__item-link--open" : undefined]
      .filter(Boolean)
      .join(" ");
    const labelText = getPlainLabel(item.label, `item ${index + 1}`);

    return (
      <li
        aria-current={current ? "page" : undefined}
        className={[current ? "active" : undefined, hasChildren ? "has-child" : undefined, "ssq-side-nav__item"]
          .filter(Boolean)
          .join(" ")}
        key={key}
      >
        {current ? (
          <span className={linkClasses}>{renderLinkContent(item)}</span>
        ) : (
          <a className={linkClasses} href={item.href} {...getNavigationProps(item.href)}>
            {renderLinkContent(item)}
          </a>
        )}
        {hasChildren ? (
          <>
            <button
              aria-controls={childListId}
              aria-expanded={expanded ? "true" : "false"}
              aria-label={`Toggle navigation, ${labelText}`}
              className={["qld__left-nav__item-toggle", expanded ? "qld__accordion--open" : "qld__accordion--closed"].join(" ")}
              type="button"
            >
              <QhdsIcon size="sm" symbol="chevron-up" />
            </button>
            {renderItems(childItems, true, itemId, childListId, expanded)}
          </>
        ) : null}
      </li>
    );
  }

  function renderItems(navItems: QhdsSideNavItem[], nested = false, parentKey = "item", listId?: string, expanded = true) {
    const classes = [
      "qld__link-list",
      nested ? (expanded ? "qld__accordion--open" : "qld__accordion--closed") : undefined,
      nested ? "qld__accordion__body" : undefined,
      "ssq-side-nav__list",
      nested ? "ssq-side-nav__list--nested" : undefined
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <ul className={classes} id={listId}>
        {navItems.map((item, index) => renderItem(item, index, parentKey))}
      </ul>
    );
  }

  const navItems =
    heading && headingHref
      ? [{ href: headingHref, icon: headingIcon, id: "home", label: heading }, ...items]
      : items;

  return (
    <div className="qld__left-nav ssq-side-nav" id={id}>
      <nav aria-label={ariaLabel} className="qld__left-nav__content ssq-side-nav__content" id={navId}>
        {heading && !headingHref ? <h2 className="ssq-side-nav__heading">{heading}</h2> : null}
        {renderItems(navItems)}
      </nav>
    </div>
  );
}
