import qldHealthIconsUrl from "@ssq/ui-assets/icons/qld-health-icons-url";
import qldIconsUrl from "@ssq/ui-assets/icons/qld-icons-url";

import type { SVGProps } from "react";

export type QhdsIconSprite = "qld" | "qld-health";

export interface QhdsIconProps extends Omit<SVGProps<SVGSVGElement>, "aria-hidden" | "aria-label" | "children" | "role"> {
  label?: string;
  sprite?: QhdsIconSprite;
  symbol: string;
}

export function getQhdsIconReference({ sprite, symbol }: Pick<QhdsIconProps, "sprite" | "symbol">) {
  const isExtendedIcon = symbol.startsWith("extended_");
  const resolvedSprite = sprite ?? (isExtendedIcon ? "qld-health" : "qld");
  const resolvedSymbol = isExtendedIcon ? symbol.replace(/^extended_/, "") : symbol;
  const spriteUrl = resolvedSprite === "qld-health" ? qldHealthIconsUrl : qldIconsUrl;

  return `${spriteUrl}#${resolvedSymbol}`;
}

export function QhdsIcon({ className, focusable = "false", label, sprite, symbol, ...props }: QhdsIconProps) {
  const accessibilityProps = label ? { "aria-label": label, role: "img" as const } : { "aria-hidden": true };

  return (
    <svg
      {...props}
      {...accessibilityProps}
      className={["qld__icon", className].filter(Boolean).join(" ")}
      focusable={focusable}
      xmlns="http://www.w3.org/2000/svg"
    >
      <use href={getQhdsIconReference({ sprite, symbol })} />
    </svg>
  );
}
