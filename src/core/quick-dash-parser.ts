import { DashboardConfig } from "../types/dashboard-config.js";
import { Variables } from "../types/variables.js";

export class QuickDashParser {
  private static replaceVariables(
    template: string,
    variables: Variables
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (variables[key] === undefined) {
        throw new Error(`Missing required variable: ${key}`);
      }

      return String(variables[key]);
    });
  }

  static exec(
    template: DashboardConfig,
    variables: Variables
  ):
    | {
        success: true;
        data: DashboardConfig;
      }
    | { success: false; error: Error } {
    try {
      if (template.variables) {
        const missingVars = template.variables.filter(
          (value) => !(value in variables)
        );

        if (missingVars.length > 0) {
          return {
            success: false,
            error: new Error(
              `Missing required variables: ${missingVars.join(", ")}`
            ),
          };
        }
      }

      const parsedQueries = Object.fromEntries(
        Object.entries(template.queries).map(([key, query]) => [
          key,
          this.replaceVariables(query, variables),
        ])
      );

      const parsedPanels = template.panels.map((panel) => ({
        ...panel,
        metrics: panel.metrics.map((metric) => ({
          ...metric,
          expression: this.replaceVariables(metric.expression, variables),
        })),
      }));

      return {
        success: true,
        data: {
          ...template,
          queries: parsedQueries,
          panels: parsedPanels,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
