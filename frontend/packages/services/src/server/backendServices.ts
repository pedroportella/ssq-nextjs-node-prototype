import "server-only";

import { createPrototypeAppSummary } from "../index";

import type { PrototypeAppKey } from "../index";
import type { AppShellData } from "./appServices";

export function createBackendAppShellData(key: PrototypeAppKey): AppShellData {
  return {
    app: createPrototypeAppSummary(key),
    backendBoundary: "server-only",
    dataSource: "backend"
  };
}
