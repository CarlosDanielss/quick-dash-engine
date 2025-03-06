# QuickDashEngine

[Leia em Português](README_PT_BR.md)

QuickDashEngine is a TypeScript library for efficient backend dashboard processing. It allows executing SQL queries, computing dynamic mathematical expressions, and optimizing execution with concurrency control.

## Key Features

- **Asynchronous query execution** with concurrency limits.
- **Dynamic calculation processing** based on query results.
- **Streaming support** for on-demand processing.
- **Easy integration with NestJS or standard Node.js applications.**
- **Support for dynamic variables** to customize queries and mathematical expressions.
- **Modular structure** with panels and metrics.

---

## Installation

```sh
npm install @quick-dash-engine/core
```

---

## Basic Usage

### 1. Creating a Query Executor

To use QuickDashEngine, provide a function that executes SQL queries and returns the results.

```typescript
import { QuickDashEngine } from "@quick-dash-engine/core";

async function executeQuery(query: string): Promise<number> {
  // Simulates an SQL query returning a random value
  return new Promise((resolve) => {
    setTimeout(() => resolve(Math.floor(Math.random() * 100)), 500);
  });
}

const quickDashEngine = new QuickDashEngine(executeQuery, 3); // Allows up to 3 concurrent queries
```

### 2. Creating a Configurable Dashboard

Define an object with SQL queries and mathematical expressions based on the results. Use panels to organize metrics.

```typescript
import { DashboardConfig } from "@quick-dash-engine/core";

const dashboardConfig: DashboardConfig = {
  queries: {
    total_revenue:
      "SELECT SUM(revenue) FROM sales WHERE date BETWEEN '{{start_date}}' AND '{{end_date}}'",
    total_expenses:
      "SELECT SUM(expenses) FROM sales WHERE date BETWEEN '{{start_date}}' AND '{{end_date}}'",
  },
  panels: [
    {
      title: "Financial",
      metrics: [
        {
          id: "net_profit",
          expression: "total_revenue - total_expenses",
          dependencies: ["total_revenue", "total_expenses"],
        },
        {
          id: "profit_margin",
          expression: "(total_revenue - total_expenses) / total_revenue",
          dependencies: ["total_revenue", "total_expenses"],
        },
      ],
    },
  ],
  variables: ["start_date", "end_date"],
};
```

### 3. Using the Parser for Variable Substitution (Optional)

If the dashboard contains variables, you can use the parser to replace values before execution.

```typescript
import { QuickDashParser } from "@quick-dash-engine/core";

const variables = { start_date: "2024-01-01", end_date: "2024-01-31" };

const parsedDashboard = QuickDashParser.exec(dashboardConfig, variables);

if (!parsedDashboard.success) {
  console.error("Error processing dashboard:", parsedDashboard.error);
} else {
  console.log("Dashboard processed successfully:", parsedDashboard.data);
}
```

### 4. Running the Dashboard

#### **Normal Mode (Processes everything and returns results)**

```typescript
async function runDashboard() {
  const results = await quickDashEngine.executeDashboard(parsedDashboard.data);

  console.log("Dashboard results:", results);
}

runDashboard();
```

#### **Streaming Mode (Receives data as it is processed)**

```typescript
async function runDashboardStream() {
  const resultStream = await quickDashEngine.executeDashboard(
    parsedDashboard.data,
    true
  );

  if (Symbol.asyncIterator in resultStream) {
    for await (const panel of resultStream) {
      console.log("On-demand result",, panel);
    }
  }
}

runDashboardStream();
```

---

## NestJS Integration

If you want to use QuickDashEngine within a **NestJS** project, you can create it as a **provider**.

### **1. Creating a QuickDashEngine Provider**

```typescript
import { Injectable } from "@nestjs/common";
import {
  QuickDashEngine,
  QuickDashParser,
  DashboardConfig,
  Variables,
} from "@quick-dash-engine/core";

@Injectable()
export class DashboardService {
  private quickDashEngine: QuickDashEngine;

  constructor() {
    this.quickDashEngine = new QuickDashEngine(this.executeQuery.bind(this), 5); // We use bind to maintain the execution context of executeQuery and limit to 5 simultaneous queries
  }

  async executeQuery(query: string): Promise<number> {
    // Here you can connect with TypeORM, Prisma, or any other ORM
    return Math.floor(Math.random() * 100); // Simulates a database return
  }

  async executeDashboard(
    dashboardConfig: DashboardConfig,
    useStream?: boolean
  ) {
    return await this.quickDashEngine.executeDashboard(
      dashboardTemplate,
      useStream
    );
  }

  parser(dashboardConfig: DashboardConfig, variables: Variables) {
    return QuickDashParser.exec(dashboardTemplate, variables);
  }
}
```

### **2. Creating a Controller to Expose via API**

```typescript
import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardTemplate } from "@quick-dash-engine/core";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard() {
    const dashboardConfig: DashboardTemplate = {
      queries: {
        total_revenue:
          "SELECT SUM(revenue) FROM sales WHERE date BETWEEN '{{start_date}}' AND '{{end_date}}'",
        total_expenses:
          "SELECT SUM(expenses) FROM sales WHERE date BETWEEN '{{start_date}}' AND '{{end_date}}'",
      },
      widgets: [
        {
          id: "net_profit",
          expression: "total_revenue - total_expenses",
          dependencies: ["total_revenue", "total_expenses"],
        },
      ],
      variables: ["start_date", "end_date"],
    };

    const variables = {
      year: 2024,
      unit_id: "iygg213vj123ghjv321",
    };

    const parsedData = this.dashboardService.parser(dashboardConfig, variables);

    if (!parsedData.success) {
      throw new BadRequestException(parsedData.error);
    }

    const results = await dashboardService.executeDashboard(
      parsedData.data,
      true
    );

    if (Symbol.asyncIterator in results) {
      for await (const panel of results) {
        console.log("on-demand result", panel);
      }
    }
  }
}
```

---

## Customization

You can define the **maximum number of concurrent queries** when instantiating the library:

```typescript
const quickDashEngine = new QuickDashEngine(executeQuery, 10); // 10 concurrent queries
```

---

## Error Handling

- **If a query fails**, the error will be captured and displayed in the console:
  ```typescript
  console.error(`Error executing query: ${result.reason}`);
  ```
- **If an expression contains invalid dependencies**, execution will fail.
- **If a required variable is missing**, an error will be returned indicating the missing variable.

---

## Contribution

Feel free to contribute with improvements by opening **issues** and submitting **pull requests** on the GitHub repository.

---

## License

This project is licensed under the [MIT License](LICENSE).

[Leia em Português](README_PT_BR.md)
