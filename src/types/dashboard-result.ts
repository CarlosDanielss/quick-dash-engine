import { MetricResult } from "./metric-result.js";

export interface DashboardResult {
  panel: string;
  results: MetricResult[];
}
