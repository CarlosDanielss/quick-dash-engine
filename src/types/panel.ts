import { MetricsToCompute } from "./metrics-to-compute.js";

export interface Panel {
  title: string;
  metrics: MetricsToCompute[];
}
