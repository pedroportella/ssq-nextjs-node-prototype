export const prototypeTokens = {
  source: "qgds-shaped-css-snapshot",
  selectedPalette: "qld-corporate",
  color: {
    primitive: {
      blue700: "#315870",
      gold500: "#c48c33",
      night: "#00041b",
      white: "#ffffff"
    },
    semanticVariables: [
      "--ssq-color-background",
      "--ssq-color-surface",
      "--ssq-color-text",
      "--ssq-color-muted",
      "--ssq-color-border",
      "--ssq-color-border-strong",
      "--ssq-color-action",
      "--ssq-color-action-text",
      "--ssq-color-error",
      "--ssq-color-focus",
      "--ssq-color-header-accent",
      "--ssq-color-header-background",
      "--ssq-color-header-text",
      "--ssq-color-info-background",
      "--ssq-color-info-border",
      "--ssq-color-success-background",
      "--ssq-color-success-border",
      "--ssq-color-warning-background",
      "--ssq-color-warning-border"
    ]
  },
  radius: {
    sm: "0.25rem",
    md: "0.5rem"
  },
  space: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    6: "1.5rem",
    8: "2rem"
  },
  typography: {
    fontFamilyBase: "Arial, Helvetica, sans-serif",
    fontSizeBase: "1rem",
    lineHeightBase: 1.5
  }
} as const;
