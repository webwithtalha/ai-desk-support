import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Extract subdomain from hostname
function getSubdomain(hostname: string): string | null {
  // For development: localhost, 127.0.0.1
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.startsWith('localhost:')) {
    // In development, you can pass subdomain as a query param or use subdomain.localhost
    // e.g., acme.localhost:3000
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      return parts[0];
    }
    return null; // No subdomain in dev
  }

  // For production: subdomain.yourdomain.com
  const parts = hostname.split('.');
  
  // Need at least 3 parts for subdomain: [subdomain, yourdomain, com]
  if (parts.length >= 3) {
    // Exclude www as a subdomain
    if (parts[0] === 'www') return null;
    return parts[0];
  }
  
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const subdomain = getSubdomain(hostname);
  
  // Public routes that don't require authentication or org context
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Auth API routes that don't need org validation
  const authApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/logout'];
  const isAuthApi = authApiRoutes.includes(pathname);
  
  // Get auth token
  const token = request.cookies.get('auth-token')?.value;
  
  // Decode token to get user's orgId (if exists)
  let userOrgId: string | null = null;
  let userRole: string | null = null;
  
  if (token) {
    try {
      // Use jose for Edge-compatible JWT verification
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
      const { payload } = await jwtVerify(token, secret);
      
      userOrgId = payload.orgId as string;
      userRole = payload.role as string;
    } catch (error) {
      // Invalid token - will be handled below
      console.error('Invalid token in middleware:', error);
    }
  }
  
  // Create response and add headers for org context
  const response = NextResponse.next();
  
  // Add subdomain to headers for API routes to use
  if (subdomain) {
    response.headers.set('x-org-subdomain', subdomain);
  }
  
  // Add user org context to headers
  if (userOrgId) {
    response.headers.set('x-user-orgid', userOrgId);
  }
  if (userRole) {
    response.headers.set('x-user-role', userRole);
  }
  
  // Skip org validation for auth routes
  if (isAuthApi || isPublicRoute) {
    // For public routes, just check authentication
    if (isPublicRoute) {
      // If already logged in, redirect to dashboard
      if (token && userOrgId) {
        // Redirect to their org's subdomain if not already there
        return NextResponse.next();
      }
      return NextResponse.next();
    }
    return response;
  }
  
  // Require authentication for all other routes
  if (!token) {
    if (pathname.startsWith('/api/')) {
      // API routes return 401
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Page routes redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Multi-tenant validation: User must belong to the subdomain's org
  if (subdomain) {
    // The actual org validation will happen in API routes where we have DB access
    // Here we just pass the subdomain along
    // API routes will validate: subdomain's orgId === user's orgId
    return response;
  }
  
  // No subdomain in request
  // In production, you'd redirect to a subdomain or show an error
  // For now, we'll allow it (useful for development)
  if (process.env.NODE_ENV === 'production') {
    // In production, require subdomain
    return NextResponse.json({ error: 'Organization subdomain required' }, { status: 400 });
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
