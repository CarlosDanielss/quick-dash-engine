# QuickDashEngine

[Leia em Português](README_PT_BR.md)

QuickDashEngine is a TypeScript library for efficient backend dashboard processing. It allows executing SQL queries, performing dynamic mathematical calculations, and optimizing execution with concurrency control.

## Main Features
 
- **Asynchronous query execution** with concurrency limit support.
- **Dynamic calculation processing** based on query results.
- **Streaming support** for on-demand processing.
- **Easy integration with NestJS or standard Node.js applications.**
- **Support for dynamic variables** to customize queries and mathematical expressions.

---

## Installation

```sh
npm install quick-dash-engine
```

---

## Basic Usage

### 1. Creating a Query Executor

To use QuickDashEngine, provide a function that executes SQL queries and returns the results.

```typescript
import { QuickDashEngine } from "quick-dash-engine";

async function executeQuery(query: string): Promise<number> {
  // Simulates an SQL query returning a random value
  return new Promise((resolve) => {
    setTimeout(() => resolve(Math.floor(Math.random() * 100)), 500);
  });
}

const quickDashEngine = new QuickDashEngine(executeQuery, 3); // Allows up to 3 concurrent queries
```

### 2. Creating a Configurable Dashboard

Define an object with SQL queries and mathematical expressions based on the results.

```typescript
import { DashboardTemplate } from "quick-dash-engine";

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
```

### 3. Running the Dashboard

#### **Normal Mode (Processes everything and returns results)**

```typescript
async function runDashboard() {
  const variables = { start_date: "2024-01-01", end_date: "2024-01-31" };
  const results = await quickDashEngine.executeDashboard(
    dashboardConfig,
    variables
  );
  console.log("Dashboard results:", results);
}

runDashboard();
```

#### **Streaming Mode (Receives data as it is processed)**

```typescript
async function runDashboardStream() {
  const variables = { start_date: "2024-01-01", end_date: "2024-01-31" };
  const resultStream = await quickDashEngine.executeDashboard(
    dashboardConfig,
    variables,
    true
  );

  for await (const value of resultStream) {
    console.log("on-demand result", value);
  }
}

runDashboardStream();
```

---

## Integration with NestJS

If you want to use QuickDashEngine within a **NestJS** project, you can create it as a **provider**.

### **1. Creating a Provider for QuickDashEngine**

```typescript
import { Injectable } from "@nestjs/common";
import { QuickDashEngine, DashboardTemplate } from "quick-dash-engine";

@Injectable()
export class DashboardService {
  private quickDashEngine: QuickDashEngine;

  constructor() {
    this.quickDashEngine = new QuickDashEngine(this.executeQuery, 5); // Limit of 5 concurrent queries
  }

  async executeQuery(query: string): Promise<number> {
    // Here you can connect to TypeORM, Prisma, or any other ORM
    return Math.floor(Math.random() * 100); // Simulates a database return
  }

  async executeDashboard(dashboardConfig: DashboardTemplate, variables: any) {
    return await this.quickDashEngine.executeDashboard(
      dashboardConfig,
      variables
    );
  }
}
```

### **2. Creating a Controller to Expose via API**

```typescript
import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardTemplate } from "quick-dash-engine";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Query() queryParams: any) {
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

    return await this.dashboardService.executeDashboard(
      dashboardConfig,
      queryParams
    );
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
- **If a required variable is missing**, an error will be returned specifying the missing variable.

---

## Contribution

Feel free to contribute with improvements by opening **issues** and submitting **pull requests** on the GitHub repository.

---

## License

This project is licensed under the [MIT License](LICENSE).

[Leia em Português](README_PT_BR.md)
