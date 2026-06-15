export { default as qhdsQldHealthIconsUrl } from "../icons/qld-health-icons-url";
export { default as qhdsQldIconsUrl } from "../icons/qld-icons-url";
export { default as qhdsUtilityIconsUrl } from "../icons/svg-icons-url";

export const qhdsCoreIconNames = [
  "arrow-left",
  "arrow-right",
  "chevron-down",
  "chevron-right",
  "close",
  "email",
  "external-link",
  "home",
  "log-out",
  "menu",
  "phone",
  "profile",
  "search"
] as const;

export const qhdsHealthIconNames = ["health_alert"] as const;

export const qhdsUtilityIconNames = [
  "accordionChevron",
  "ctaIcon",
  "mobileMenuCloseIcon",
  "mobileMenuOpenIcon",
  "qld__icon__arrow-left",
  "qld__icon__arrow-right",
  "qld__icon__chevron-down",
  "qld__icon__close",
  "qld__icon__home",
  "qld__icon__mobile-menu",
  "qld__icon__search"
] as const;

export type QhdsCoreIconName = (typeof qhdsCoreIconNames)[number];
export type QhdsHealthIconName = (typeof qhdsHealthIconNames)[number];
export type QhdsUtilityIconName = (typeof qhdsUtilityIconNames)[number];

export const qhdsIconSprites = {
  qld: {
    fileName: "QLD-icons.svg",
    label: "QHDS core icon sprite",
    packageExport: "@ssq/ui-assets/icons/qld-icons-url"
  },
  qldHealth: {
    extendedPrefix: "extended_",
    fileName: "QLD-Health-icons.svg",
    label: "QHDS health icon sprite",
    packageExport: "@ssq/ui-assets/icons/qld-health-icons-url"
  },
  utility: {
    fileName: "svg-icons.svg",
    label: "QHDS utility icon sprite",
    packageExport: "@ssq/ui-assets/icons/svg-icons-url"
  }
} as const;

export const prototypeAssetManifest = {
  logos: {
    prototypeWordmark: {
      label: "SSQ prototype",
      text: "SSQ"
    }
  },
  icons: {
    names: {
      qld: qhdsCoreIconNames,
      qldHealth: qhdsHealthIconNames,
      utility: qhdsUtilityIconNames
    },
    sprites: qhdsIconSprites
  }
} as const;
