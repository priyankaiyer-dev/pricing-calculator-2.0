/**
 * API Route: /api/user
 * Extracts user information from gap-auth header
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable caching

export async function GET(request: NextRequest) {
  try {
    // Extract user from headers
    // Databricks Apps puts the email in x-forwarded-email
    const gapAuth = request.headers.get('x-forwarded-email') || 
                    request.headers.get('gap-auth') || 
                    request.headers.get('x-forwarded-user');
    
    if (!gapAuth) {
      // No header found - use default for local development
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // Default test user for local development
        return NextResponse.json({
          success: true,
          data: {
            name: 'Test User',
            email: 'test.user@samsara.com',
          },
        });
      }
      
      // Production: return null values for fallback
      return NextResponse.json({
        success: true,
        data: {
          name: null,
          email: null,
        },
      });
    }

    // Parse email from header
    const email = gapAuth.trim();
    
    // Extract first name
    let name: string | null = null;
    
    if (email.includes('@')) {
      // Full email format: extract part before @, then get first part before .
      const localPart = email.split('@')[0];
      const nameParts = localPart.split('.');
      // Capitalize first name
      name = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    } else {
      // Just first name provided
      name = email.charAt(0).toUpperCase() + email.slice(1);
    }

    return NextResponse.json({
      success: true,
      data: {
        name,
        email: email.includes('@') ? email : null,
      },
    });
  } catch (error: any) {
    console.error('Error extracting user from gap-auth header:', error);
    
    // Return null values on error for graceful fallback
    return NextResponse.json({
      success: true,
      data: {
        name: null,
        email: null,
      },
    });
  }
}
