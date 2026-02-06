/**
 * Databricks API client for SQL Statement Execution
 * @see https://docs.databricks.com/api/workspace/statementexecution
 */

export interface DatabricksConfig {
  host: string;
  token: string;
  warehouseId: string;
}

function getConfig(): DatabricksConfig {
  const host = process.env.DATABRICKS_HOST;
  const token = process.env.DATABRICKS_TOKEN;
  const warehouseId = process.env.DATABRICKS_WAREHOUSE_ID;

  if (!host || !token || !warehouseId) {
    throw new Error(
      'Missing Databricks config. Set DATABRICKS_HOST, DATABRICKS_TOKEN, and DATABRICKS_WAREHOUSE_ID in .env.local'
    );
  }

  return {
    host: host.startsWith('http') ? host : `https://${host}`,
    token,
    warehouseId,
  };
}

export interface StatementResult {
  statement_id: string;
  status: { state: string };
  manifest?: {
    schema: { columns: Array<{ name: string; type_name: string }> };
  };
  result?: {
    data_array?: unknown[][];
  };
}

/**
 * Execute a SQL statement on the Databricks SQL warehouse.
 * For quick statements, returns results directly. For longer queries,
 * polls until complete and returns results.
 */
export async function executeStatement(
  statement: string,
  options?: { waitTimeout?: number }
): Promise<StatementResult> {
  const { host, token, warehouseId } = getConfig();
  const baseUrl = host.replace(/\/$/, '');
  const url = `${baseUrl}/api/2.0/sql/statements`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      warehouse_id: warehouseId,
      statement: statement,
      wait_timeout: options?.waitTimeout ?? 30,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Databricks API error (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as StatementResult;

  // If still running, poll for results
  if (data.status?.state === 'PENDING' || data.status?.state === 'RUNNING') {
    return pollStatementResult(baseUrl, token, data.statement_id, options?.waitTimeout);
  }

  return data;
}

async function pollStatementResult(
  baseUrl: string,
  token: string,
  statementId: string,
  waitTimeout = 30
): Promise<StatementResult> {
  const url = `${baseUrl}/api/2.0/sql/statements/${statementId}`;
  const start = Date.now();
  const timeoutMs = waitTimeout * 1000;

  while (Date.now() - start < timeoutMs) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Databricks API error (${response.status}): ${await response.text()}`);
    }

    const data = (await response.json()) as StatementResult;

    if (data.status?.state === 'SUCCEEDED') {
      return data;
    }
    if (data.status?.state === 'FAILED' || data.status?.state === 'CANCELED') {
      throw new Error(
        `Databricks statement failed: ${data.status.state}`
      );
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error('Databricks statement execution timed out');
}
