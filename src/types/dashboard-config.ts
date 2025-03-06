import { Panel } from "./panel.js";
import { QueryMap } from "./query-map.js";

export interface DashboardConfig {
  queries: QueryMap;
  variables?: string[];
  panels: Panel[];
}
