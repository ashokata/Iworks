import { NextRequest, NextResponse } from 'next/server';

const MENDIX_API_URL = process.env.MENDIX_API_URL || 'http://localhost:4000';

async function proxyRequest(
  request: NextRequest,
  method: string
): Promise<NextResponse> {
  try {
    // Extract path from URL - remove /api-proxy or /api/proxy prefix
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/\/api[-\/]proxy\/(.*)/);

    if (!pathMatch) {
      return NextResponse.json(
        { error: 'Invalid proxy path' },
        { status: 400 }
      );
    }

    const targetPath = pathMatch[1];
    const targetUrl = `${MENDIX_API_URL}/${targetPath}${url.search}`;

    console.log(`[API Proxy] ${method} ${targetPath} -> ${targetUrl}`);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Copy authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Copy tenant ID header if present
    const tenantHeader = request.headers.get('x-tenant-id');
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
          console.log(`[API Proxy] Request body:`, body);
        }
      } catch (error) {
        console.error('[API Proxy] Error reading request body:', error);
      }
    }

    // Make the proxied request
    const response = await fetch(targetUrl, fetchOptions);

    console.log(`[API Proxy] Response status: ${response.status}`);

    // Get response body
    const responseText = await response.text();
    let responseData;

    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.warn('[API Proxy] Response is not JSON:', responseText);
      responseData = responseText;
    }

    // Return response with same status
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('[API Proxy] Error:', error.message);
    return NextResponse.json(
      {
        error: 'Proxy error',
        message: error.message,
        details: 'Failed to forward request to backend API'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}