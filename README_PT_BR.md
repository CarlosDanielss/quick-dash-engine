# QuickDashEngine

[Read in English](README.md)

QuickDashEngine é uma biblioteca em TypeScript para processamento eficiente de dashboards no backend. Ela permite executar consultas SQL, calcular expressões matemáticas dinâmicas e otimizar a execução com controle de concorrência.

## Recursos Principais

- **Execução de queries assíncronas** com suporte para limites de concorrência.
- **Processamento dinâmico de cálculos** baseado nos resultados das queries.
- **Suporte a streaming** para processamento sob demanda.
- **Fácil integração com NestJS ou aplicações Node.js comuns.**
- **Suporte a variáveis dinâmicas** para customização de queries e expressões matemáticas.
- **Estrutura modular** com painéis (panels) e métricas (metrics).

---

## Instalação

```sh
npm install @quick-dash-engine/core
```

---

## Uso Básico

### 1. Criando um Executador de Queries

Para usar o QuickDashEngine, forneça uma função que execute queries SQL e retorne os resultados.

```typescript
import { QuickDashEngine } from "@quick-dash-engine/core";

async function executeQuery(query: string): Promise<number> {
  // Simula uma consulta SQL retornando um valor aleatório
  return new Promise((resolve) => {
    setTimeout(() => resolve(Math.floor(Math.random() * 100)), 500);
  });
}

const quickDashEngine = new QuickDashEngine(executeQuery, 3); // Permite até 3 queries simultâneas
```

### 2. Criando um Dashboard Configurável

Defina um objeto com queries SQL e expressões matemáticas baseadas nos resultados. Use painéis (panels) para organizar as métricas.

```typescript
import { DashboardConfig } from "@quick-dash-engine/core";

const dashboardConfig: DashboardConfig = {
  queries: {
    receita_total:
      "SELECT SUM(receita) FROM vendas WHERE data BETWEEN '{{data_inicio}}' AND '{{data_fim}}'",
    despesas_totais:
      "SELECT SUM(despesas) FROM vendas WHERE data BETWEEN '{{data_inicio}}' AND '{{data_fim}}'",
  },
  panels: [
    {
      title: "Financeiro",
      metrics: [
        {
          id: "lucro_liquido",
          expression: "receita_total - despesas_totais",
          dependencies: ["receita_total", "despesas_totais"],
        },
        {
          id: "margem_lucro",
          expression: "(receita_total - despesas_totais) / receita_total",
          dependencies: ["receita_total", "despesas_totais"],
        },
      ],
    },
  ],
  variables: ["data_inicio", "data_fim"],
};
```

### 3. Utilizando o Parser para Substituição de Variáveis (Opcional)

Se o dashboard contiver variáveis em sua estrutura, é possível utilizar o parser para substituir os valores antes da execução.

```typescript
import { QuickDashParser } from "@quick-dash-engine/core";

const variables = { data_inicio: "2024-01-01", data_fim: "2024-01-31" };

const parsedDashboard = QuickDashParser.exec(dashboardConfig, variables);

if (!parsedDashboard.success) {
  console.error("Erro ao processar o dashboard:", parsedDashboard.error);
} else {
  console.log("Dashboard processado com sucesso:", parsedDashboard.data);
}
```

### 4. Executando o Dashboard

#### **Modo Normal (Processa tudo e retorna)**

```typescript
async function runDashboard() {
  const results = await quickDashEngine.executeDashboard(parsedDashboard.data);

  console.log("Resultados do dashboard:", results);
}

runDashboard();
```

#### **Modo Streaming (Recebe dados conforme são processados)**

```typescript
async function runDashboardStream() {
  const resultStream = await quickDashEngine.executeDashboard(
    parsedDashboard.data,
    true
  );

  if (Symbol.asyncIterator in resultStream) {
    for await (const panel of resultStream) {
      console.log("resultado sob demanda", panel);
    }
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
    this.quickDashEngine = new QuickDashEngine(this.executeQuery.bind(this), 5); // Utilizamos o bind para manter o contexto da execução do execute query e Limite de 5 queries simultâneas
  }

  async executeQuery(query: string): Promise<number> {
    // Aqui você pode conectar com TypeORM, Prisma ou qualquer outro ORM
    return Math.floor(Math.random() * 100); // Simula um retorno do banco
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

### **2. Criar um Controller para expor via API**

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

    const variables = {
      year: 2024,
      unit_id: "iygg213vj123ghjv321",
    };

    const parsedData = this.dashboardService.parser(
      dashboardConfig,
      variables
    );

    if (!parsedData.success) {
      throw new BadRequestException(parsedData.error);
    }

    const results = await dashboardService.executeDashboard(
      parsedData.data,
      true
    );

    if (Symbol.asyncIterator in results) {
      for await (const panel of results) {
        console.log("resultado sob demanda", panel);
      }
    }
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
