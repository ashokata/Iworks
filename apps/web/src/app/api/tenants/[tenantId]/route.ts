import { NextRequest, NextResponse } from 'next/server';
import { Tenant } from '@/types';

/**
 * Tenant API endpoint
 * Returns tenant information by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    console.log(`[Tenant API] Fetching tenant: ${tenantId}`);

    // For now, return mock tenant data
    // In production, this would fetch from a database or external API
    const mockTenant: Tenant = {
      id: tenantId,
      name: 'InField Works Services',
      slug: 'infield-works',
      domain: 'infieldworks.com',
      industry: 'Field Service Management',
      size: 'Medium',
      createdAt: new Date().toISOString(),
      active: true,
    };

    console.log(`[Tenant API] Returning tenant data for: ${tenantId}`);

    return NextResponse.json(mockTenant, { status: 200 });
  } catch (error: any) {
    console.error('[Tenant API] Error fetching tenant:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch tenant data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
