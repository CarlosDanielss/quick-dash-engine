import { evaluate as mathEvaluate } from "mathjs";

import { QueryMap } from "../types/query-map.js";
import { Widget } from "../types/widget.js";
import { DashboardTemplate } from "../types/dashboard-template.js";

type ExecuteQuery = (query: string) => Promise<number>;

export class QuickDashEngine {
  constructor(
    private readonly executeQuery: ExecuteQuery,
    private readonly maxConcurrentQueries: number = 5
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
    widgets: Widget[],
    queryStream: AsyncGenerator<{ id: string; value: number }>
  ): AsyncGenerator<{ id: string; value: number }> {
    const calculatedValues: Record<string, number> = {};
    const pendingWidgets = [...widgets];

    for await (const { id, value } of queryStream) {
      calculatedValues[id] = value;
      yield { id, value };
    }

    while (pendingWidgets.length > 0) {
      for (let i = pendingWidgets.length - 1; i >= 0; i--) {
        const { id, expression, dependencies } = pendingWidgets[i];

        if (dependencies.every((dep) => calculatedValues.hasOwnProperty(dep))) {
          calculatedValues[id] = this.evaluateExpression(
            expression,
            calculatedValues
          );

          yield { id, value: calculatedValues[id] };
          pendingWidgets.splice(i, 1);
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

  async executeDashboard(dashboard: DashboardTemplate, useStream = false) {
    const queryStream = this.processQueries(dashboard.queries);
    const calculationStream = this.processCalculations(
      dashboard.widgets,
      queryStream
    );

    if (useStream) {
      return calculationStream;
    }

    const results: Record<string, number> = {};

    for await (const { id, value } of calculationStream) {
      results[id] = value;
    }

    return results;
  }
}
