import qldHealthIconsUrl from "@ssq/ui-assets/icons/qld-health-icons-url";
import qldIconsUrl from "@ssq/ui-assets/icons/qld-icons-url";
import svgIconsUrl from "@ssq/ui-assets/icons/svg-icons-url";

import type { SVGProps } from "react";

export type QhdsIconSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "feature-lg";
export type QhdsIconSprite = "qld" | "qld-health" | "utility";

export interface QhdsIconProps extends Omit<SVGProps<SVGSVGElement>, "aria-hidden" | "aria-label" | "children" | "role"> {
  label?: string;
  size?: QhdsIconSize;
  sprite?: QhdsIconSprite;
  symbol: string;
}

export function getQhdsIconReference({ sprite, symbol }: Pick<QhdsIconProps, "sprite" | "symbol">) {
  const isExtendedIcon = !sprite && symbol.startsWith("extended_");
  const resolvedSprite = sprite ?? (isExtendedIcon ? "qld-health" : "qld");
  const resolvedSymbol = isExtendedIcon ? symbol.replace(/^extended_/, "") : symbol;
  const spriteUrl = {
    qld: qldIconsUrl,
    "qld-health": qldHealthIconsUrl,
    utility: svgIconsUrl
  }[resolvedSprite];

  return `${spriteUrl}#${resolvedSymbol}`;
}

export function QhdsIcon({ className, focusable = "false", label, size, sprite, symbol, ...props }: QhdsIconProps) {
  const accessibilityProps = label ? { "aria-label": label, role: "img" as const } : { "aria-hidden": true };

  return (
    <svg
      {...props}
      {...accessibilityProps}
      className={["qld__icon", size ? `qld__icon--${size}` : null, className].filter(Boolean).join(" ")}
      focusable={focusable}
      xmlns="http://www.w3.org/2000/svg"
    >
      <use href={getQhdsIconReference({ sprite, symbol })} />
    </svg>
  );
}
