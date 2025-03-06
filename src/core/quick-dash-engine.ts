import { evaluate as mathEvaluate } from "mathjs";

import { QueryMap } from "../types/query-map.js";
import { MetricsToCompute } from "../types/metrics-to-compute.js";
import { Panel } from "../types/panel.js";
import { DashboardConfig } from "../types/dashboard-config.js";
import { DashboardResult } from "../types/dashboard-result.js";

type ExecuteQuery = (query: string) => Promise<number>;

export class QuickDashEngine {
  constructor(
    private readonly executeQuery: ExecuteQuery,
    private readonly maxConcurrentQueries: number = 20
  ) {}

  private async *processQueries(
    queries: QueryMap
  ): AsyncGenerator<{ id: string; value: number }> {
    const queryEntries = Object.entries(queries);

    while (queryEntries.length > 0) {
      const batch = queryEntries.splice(0, this.maxConcurrentQueries);

      const batchResults = await Promise.allSettled(
        batch.map(([id, query]) =>
          this.executeQuery(query).then((value) => ({ id, value }))
        )
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          yield result.value;
        } else {
          console.error(`Erro ao executar query: ${result.reason}`);
        }
      }
    }
  }

  private async *processCalculations(
    metricsToCompute: MetricsToCompute[],
    queryStream: AsyncGenerator<{ id: string; value: number }>,
    calculatedValues: Record<string, number>
  ): AsyncGenerator<{ id: string; value: number }> {
    const pendingMetrics = [...metricsToCompute];

    for await (const { id, value } of queryStream) {
      calculatedValues[id] = value;
    }

    while (pendingMetrics.length > 0) {
      for (let i = pendingMetrics.length - 1; i >= 0; i--) {
        const { id, expression, dependencies } = pendingMetrics[i];

        if (dependencies.every((dep) => calculatedValues.hasOwnProperty(dep))) {
          calculatedValues[id] = this.evaluateExpression(
            expression,
            calculatedValues
          );

          yield { id, value: calculatedValues[id] };
          pendingMetrics.splice(i, 1);
        }
      }
    }
  }

  private evaluateExpression(
    expression: string,
    values: Record<string, number>
  ): number {
    return mathEvaluate(expression, values);
  }

  private async *processPanelResults(
    panels: Panel[],
    queries: QueryMap,
    useStream: boolean
  ): AsyncGenerator<{
    panel: string;
    results: { id: string; value: number }[];
  }> {
    const panelCache: Record<
      string,
      { panel: string; results: { id: string; value: number }[] }
    > = {};

    const calculatedValues: Record<string, number> = {};

    for (const panel of panels) {
      if (useStream && panelCache[panel.title]) {
        yield panelCache[panel.title];
        continue;
      }

      const relevantQueries: QueryMap = panel.metrics.reduce((acc, metric) => {
        metric.dependencies.forEach((dependency) => {
          if (queries[dependency] && !acc[dependency]) {
            acc[dependency] = queries[dependency];
          }
        });

        return acc;
      }, {} as QueryMap);

      const queryStream = this.processQueries(relevantQueries);

      const results: { id: string; value: number }[] = [];

      for await (const result of this.processCalculations(
        panel.metrics,
        queryStream,
        calculatedValues
      )) {
        results.push(result);
      }

      const panelResult = { panel: panel.title, results };
      panelCache[panel.title] = panelResult;

      yield panelResult;
    }
  }

  async executeDashboard(
    dashboard: DashboardConfig,
    useStream = false
  ): Promise<DashboardResult[] | AsyncGenerator<DashboardResult>> {
    if (useStream) {
      return this.processPanelResults(
        dashboard.panels,
        dashboard.queries,
        useStream
      );
    }

    const panelResults = [];
    for await (const result of this.processPanelResults(
      dashboard.panels,
      dashboard.queries,
      useStream
    )) {
      panelResults.push(result);
    }

    return panelResults;
  }
}