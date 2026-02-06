/**
 * API Route: /api/quotes
 * GET: List all quotes (sorted by most recently edited)
 * POST: Create a new quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { quoteStore } from '@/lib/data/quoteStore';
import { Quote } from '@/lib/types/quote';
import { generateDealName } from '@/lib/utils/formatting';
import { calculatePaymentOptionPricing } from '@/lib/utils/calculations';
import { DEFAULT_PRICEBOOK, DEFAULT_CURRENCY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/quotes] Fetching all quotes');
    const quotes = quoteStore.getAllQuotes();
    console.log(`[GET /api/quotes] Returning ${quotes.length} quotes`);
    quotes.forEach(q => console.log(`  - ${q.id}: ${q.dealName}`));
    return NextResponse.json({
      success: true,
      data: quotes,
    });
  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch quotes',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accountName,
      dealName,
      opportunityId,
      pricingOptions,
      pricingOption, // Legacy support
      pricebook = DEFAULT_PRICEBOOK,
      currency = DEFAULT_CURRENCY,
      termLength,
      productLineItems = [],
      notes,
      pricingExpiresOn,
      createdBy,
    } = body;

    // Generate deal name if not provided
    const finalDealName = dealName || generateDealName(accountName);

    // Validate required fields
    if (!accountName || accountName.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Account name is required',
        },
        { status: 400 }
      );
    }

    // Support both new (pricingOptions array) and legacy (pricingOption single) formats
    const finalPricingOptions = pricingOptions || (pricingOption ? [pricingOption] : ['Annual']);

    if (!Array.isArray(finalPricingOptions) || finalPricingOptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one pricing option is required',
        },
        { status: 400 }
      );
    }

    // Validate term length
    const finalTermLength = termLength && termLength > 0 ? termLength : 36;

    // Calculate payment option pricing using product-level discounts and rebates/subsidies
    let paymentOptionPricing;
    try {
      paymentOptionPricing = calculatePaymentOptionPricing(
        productLineItems || [],
        finalPricingOptions,
        finalTermLength,
        body.rebatesAndSubsidies
      );
    } catch (calcError: any) {
      console.error('Error calculating payment option pricing:', calcError);
      return NextResponse.json(
        {
          success: false,
          error: 'Error calculating pricing: ' + (calcError.message || 'Unknown calculation error'),
        },
        { status: 500 }
      );
    }

    const newQuote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> = {
      accountName: accountName.trim(),
      dealName: finalDealName.trim(),
      opportunityId: opportunityId?.trim() || undefined,
      pricingOptions: finalPricingOptions,
      pricebook,
      currency,
      termLength: finalTermLength,
      productLineItems: productLineItems || [],
      paymentOptionPricing,
      rebatesAndSubsidies: body.rebatesAndSubsidies || undefined,
      notes: notes?.trim() || undefined,
      pricingExpiresOn,
      createdBy: createdBy || 'unknown',
    };

    try {
      const quote = quoteStore.createQuote(newQuote);
      console.log('Quote created successfully:', quote.id, quote.dealName);
      
      // Verify the quote was created correctly
      if (!quote.id) {
        throw new Error('Quote created but missing ID');
      }
      
      // Verify quote exists in store
      const verifyQuote = quoteStore.getQuoteById(quote.id);
      if (!verifyQuote) {
        throw new Error('Quote created but not found in store');
      }
      console.log('Quote verified in store:', verifyQuote.id);

      return NextResponse.json({
        success: true,
        data: quote,
      }, { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (createError: any) {
      console.error('Error in quoteStore.createQuote:', createError);
      console.error('Quote data that failed:', JSON.stringify(newQuote, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: createError.message || 'Failed to create quote in store',
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
  } catch (error: any) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create quote',
      },
      { status: 500 }
    );
  }
}
