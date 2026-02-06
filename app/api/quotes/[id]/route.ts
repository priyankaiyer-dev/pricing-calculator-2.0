/**
 * API Route: /api/quotes/[id]
 * GET: Get a specific quote
 * PUT: Update a quote
 * DELETE: Delete a quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { quoteStore } from '@/lib/data/quoteStore';
import { calculatePaymentOptionPricing } from '@/lib/utils/calculations';
import { Quote } from '@/lib/types/quote';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[GET /api/quotes/[id]] Fetching quote with ID:', id);
    console.log('[GET /api/quotes/[id]] Store instance:', quoteStore);
    
    if (!id || id.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote ID is required',
        },
        { status: 400 }
      );
    }
    
    // First, check all quotes to see what's available
    const allQuotes = quoteStore.getAllQuotes();
    console.log(`[GET /api/quotes/[id]] Total quotes in store: ${allQuotes.length}`);
    console.log(`[GET /api/quotes/[id]] Available IDs:`, allQuotes.map(q => q.id));
    
    const quote = quoteStore.getQuoteById(id);
    console.log('[GET /api/quotes/[id]] Quote found:', quote ? 'yes' : 'no', quote ? `(${quote.dealName})` : '');
    
    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: `Quote with ID "${id}" not found. Available quotes: ${allQuotes.length}`,
        },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error: any) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch quote',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const existingQuote = quoteStore.getQuoteById(id);
    if (!existingQuote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote not found',
        },
        { status: 404 }
      );
    }

    // Recalculate payment option pricing if line items, pricing options, term length, or rebates/subsidies changed
    let paymentOptionPricing = existingQuote.paymentOptionPricing;
    if (body.productLineItems || body.pricingOptions || body.termLength || body.rebatesAndSubsidies) {
      const lineItems = body.productLineItems || existingQuote.productLineItems;
      const pricingOptions = body.pricingOptions || (existingQuote as any).pricingOptions || 
                            ((existingQuote as any).pricingOption ? [(existingQuote as any).pricingOption] : ['Annual']);
      const termLength = body.termLength || existingQuote.termLength;
      const rebatesAndSubsidies = body.rebatesAndSubsidies || existingQuote.rebatesAndSubsidies;
      
      paymentOptionPricing = calculatePaymentOptionPricing(
        lineItems,
        pricingOptions,
        termLength,
        rebatesAndSubsidies
      );
    }

    const updates: Partial<Quote> = {
      ...body,
      paymentOptionPricing,
    };

    const updated = quoteStore.updateQuote(id, updates);
    
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update quote',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update quote',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = quoteStore.deleteQuote(id);
    
    if (!deleted) {
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
      data: { id },
    });
  } catch (error: any) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete quote',
      },
      { status: 500 }
    );
  }
}
