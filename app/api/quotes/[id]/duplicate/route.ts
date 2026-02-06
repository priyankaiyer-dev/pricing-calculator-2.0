/**
 * API Route: /api/quotes/[id]/duplicate
 * POST: Duplicate an existing quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { quoteStore } from '@/lib/data/quoteStore';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { createdBy } = body;

    const duplicated = quoteStore.duplicateQuote(id, createdBy || 'unknown');
    
    if (!duplicated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: duplicated,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error duplicating quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to duplicate quote',
      },
      { status: 500 }
    );
  }
}
