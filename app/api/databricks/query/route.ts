/**
 * API Route: /api/databricks/query
 * POST: Execute a SQL query against the Databricks SQL warehouse
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeStatement } from '@/lib/databricks';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "query" in request body' },
        { status: 400 }
      );
    }

    const result = await executeStatement(query);

    return NextResponse.json({
      success: true,
      data: {
        statementId: result.statement_id,
        status: result.status?.state,
        columns: result.manifest?.schema?.columns,
        rows: result.result?.data_array ?? [],
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to execute query';
    console.error('Databricks query error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
