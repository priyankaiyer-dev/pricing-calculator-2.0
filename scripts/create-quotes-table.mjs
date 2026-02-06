#!/usr/bin/env node
/**
 * Creates the quotes table in Databricks via the Statement Execution API.
 * Loads credentials from .env.local
 * Run: node scripts/create-quotes-table.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env.local
const envPath = join(rootDir, '.env.local');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  });
}

const host = process.env.DATABRICKS_HOST;
const token = process.env.DATABRICKS_TOKEN;
const warehouseId = process.env.DATABRICKS_WAREHOUSE_ID;

if (!host || !token || !warehouseId) {
  console.error('Missing DATABRICKS_HOST, DATABRICKS_TOKEN, or DATABRICKS_WAREHOUSE_ID in .env.local');
  process.exit(1);
}

const baseUrl = host.startsWith('http') ? host : `https://${host}`;
const sqlPath = join(__dirname, 'create-quotes-table.sql');
const sql = readFileSync(sqlPath, 'utf8');

console.log('Creating quotes table in Databricks...\n');
console.log('SQL:', sql.replace(/\n/g, '\n  '), '\n');

const response = await fetch(`${baseUrl}/api/2.0/sql/statements`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    warehouse_id: warehouseId,
    statement: sql,
    wait_timeout: 60,
  }),
});

if (!response.ok) {
  const err = await response.text();
  console.error('Databricks API error:', response.status, err);
  process.exit(1);
}

const result = await response.json();
if (result.status?.state === 'SUCCEEDED') {
  console.log('✓ Table main.default.quotes created successfully!');
} else if (result.status?.state === 'FAILED' || result.status?.state === 'CANCELED') {
  console.error('Statement failed:', result.status);
  process.exit(1);
} else {
  console.log('Statement status:', result.status?.state);
}
