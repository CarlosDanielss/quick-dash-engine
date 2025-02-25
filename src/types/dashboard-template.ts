import { QueryMap } from "./query-map.js";
import { Widget } from "./widget.js";

export interface DashboardTemplate {
  queries: QueryMap;
  widgets: Widget[];
  variables?: string[];
}
