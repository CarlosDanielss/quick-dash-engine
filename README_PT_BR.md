# QuickDashEngine

[Read in English](README.md)

QuickDashEngine é uma biblioteca em TypeScript para processamento eficiente de dashboards no backend. Ela permite executar consultas SQL, calcular expressões matemáticas dinâmicas e otimizar a execução com controle de concorrência.

## Recursos Principais

- **Execução de queries assíncronas** com suporte para limites de concorrência.
- **Processamento dinâmico de cálculos** baseado nos resultados das queries.
- **Suporte a streaming** para processamento sob demanda.
- **Fácil integração com NestJS ou aplicações Node.js comuns.**
- **Suporte a variáveis dinâmicas** para customização de queries e expressões matemáticas.

---

## Instalação

```sh
npm install quick-dash-engine
```

---

## Uso Básico

### 1. Criando um Executador de Queries

Para usar o QuickDashEngine, forneça uma função que execute queries SQL e retorne os resultados.

```typescript
import { QuickDashEngine } from "quick-dash-engine";

async function executeQuery(query: string): Promise<number> {
  // Simula uma consulta SQL retornando um valor aleatório
  return new Promise((resolve) => {
    setTimeout(() => resolve(Math.floor(Math.random() * 100)), 500);
  });
}

const quickDashEngine = new QuickDashEngine(executeQuery, 3); // Permite até 3 queries simultâneas
```

### 2. Criando um Dashboard Configurável

Defina um objeto com queries SQL e expressões matemáticas baseadas nos resultados.

```typescript
import { DashboardTemplate } from "quick-dash-engine";

const dashboardConfig: DashboardTemplate = {
  queries: {
    receita_total:
      "SELECT SUM(receita) FROM vendas WHERE data BETWEEN '{{data_inicio}}' AND '{{data_fim}}'",
    despesas_totais:
      "SELECT SUM(despesas) FROM vendas WHERE data BETWEEN '{{data_inicio}}' AND '{{data_fim}}'",
  },
  widgets: [
    {
      id: "lucro_liquido",
      expression: "receita_total - despesas_totais",
      dependencies: ["receita_total", "despesas_totais"],
    },
  ],
  variables: ["data_inicio", "data_fim"],
};
```

### 3. Executando o Dashboard

#### **Modo Normal (Processa tudo e retorna)**

```typescript
async function runDashboard() {
  const variables = { data_inicio: "2024-01-01", data_fim: "2024-01-31" };
  const results = await quickDashEngine.executeDashboard(
    dashboardConfig,
    variables
  );
  
  console.log("Resultados do dashboard:", results);
}

runDashboard();
```

#### **Modo Streaming (Recebe dados conforme são processados)**

```typescript
async function runDashboardStream() {
  const variables = { data_inicio: "2024-01-01", data_fim: "2024-01-31" };
  const resultStream = await quickDashEngine.executeDashboard(
    dashboardConfig,
    variables,
    true
  );

  for await (const value of resultStream) {
    console.log("resultado sob demanda", value);
  }
}

runDashboardStream();
```

---

## Integração com NestJS

Se você deseja utilizar o QuickDashEngine dentro de um projeto **NestJS**, você pode criá-lo como um **provider**.

### **1. Criar um Provider para QuickDashEngine**

```typescript
import { Injectable } from "@nestjs/common";
import { QuickDashEngine, DashboardTemplate } from "quick-dash-engine";

@Injectable()
export class DashboardService {
  private quickDashEngine: QuickDashEngine;

  constructor() {
    this.quickDashEngine = new QuickDashEngine(this.executeQuery, 5); // Limite de 5 queries simultâneas
  }

  async executeQuery(query: string): Promise<number> {
    // Aqui você pode conectar com TypeORM, Prisma ou qualquer outro ORM
    return Math.floor(Math.random() * 100); // Simula um retorno do banco
  }

  async executeDashboard(dashboardConfig: DashboardTemplate, variables: any) {
    return await this.quickDashEngine.executeDashboard(
      dashboardConfig,
      variables
    );
  }
}
```

### **2. Criar um Controller para expor via API**

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
        receita_total:
          "SELECT SUM(receita) FROM vendas WHERE data BETWEEN '{{data_inicio}}' AND '{{data_fim}}'",
        despesas_totais:
          "SELECT SUM(despesas) FROM vendas WHERE data BETWEEN '{{data_inicio}}' AND '{{data_fim}}'",
      },
      widgets: [
        {
          id: "lucro_liquido",
          expression: "receita_total - despesas_totais",
          dependencies: ["receita_total", "despesas_totais"],
        },
      ],
      variables: ["data_inicio", "data_fim"],
    };

    return await this.dashboardService.executeDashboard(
      dashboardConfig,
      queryParams
    );
  }
}
```

---

## Personalização

Você pode definir o **número máximo de queries concorrentes** ao instanciar a biblioteca:

```typescript
const quickDashEngine = new QuickDashEngine(executeQuery, 10); // 10 queries simultâneas
```

---

## Tratamento de Erros

- **Se uma query falhar**, o erro será capturado e exibido no console:
  ```typescript
  console.error(`Erro ao executar query: ${result.reason}`);
  ```
- **Se uma expressão contiver dependências inválidas**, a execução falhará.
- **Se uma variável obrigatória estiver ausente**, um erro será retornado informando a variável faltante.

---

## Contribuição

Sinta-se à vontade para contribuir com melhorias, abrindo **issues** e enviando **pull requests** no repositório do GitHub.

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

[Read in English](README_EN.md)
