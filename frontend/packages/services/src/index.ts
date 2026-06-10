import { formatPrototypeLabel } from "@ssq/utils";

export type PrototypeAppKey = "dashboard" | "seniors-card" | "rental-security-subsidy";

export interface PrototypeAppSummary {
  key: PrototypeAppKey;
  label: string;
  status: "UP";
}

export function createPrototypeAppSummary(key: PrototypeAppKey): PrototypeAppSummary {
  return {
    key,
    label: key === "dashboard" ? "SSQ Service Dashboard" : formatPrototypeLabel(key),
    status: "UP"
  };
}
