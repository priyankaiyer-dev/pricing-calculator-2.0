/**
 * API Route: /api/products
 * GET: Get products filtered by pricebook and/or search query
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, getProductsByPricebook } from '@/lib/data/mockProducts';
import { Pricebook } from '@/lib/types/product';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const pricebook = searchParams.get('pricebook') as Pricebook | null;

    let products;
    
    if (query) {
      products = searchProducts(query, pricebook || undefined);
    } else if (pricebook) {
      products = getProductsByPricebook(pricebook);
    } else {
      // Return all products if no filter
      products = getProductsByPricebook('FY26');
    }

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}
