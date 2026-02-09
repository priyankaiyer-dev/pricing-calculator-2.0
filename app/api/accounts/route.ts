/**
 * API Route: /api/accounts
 * GET: Search accounts by name
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchAccounts, getAccountByName } from '@/lib/data/mockAccounts';
import type { Account } from '@/lib/types/account';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const exact = searchParams.get('exact') === 'true';

    let accounts: Account[];

    if (exact && query) {
      const account = getAccountByName(query);
      accounts = account ? [account] : [];
    } else if (query) {
      accounts = searchAccounts(query);
    } else {
      accounts = [];
    }

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch accounts',
      },
      { status: 500 }
    );
  }
}
