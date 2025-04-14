// middleware.ts (update this file in the project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/callback',
  '/auth/error',
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/auth/signout',
];

// List of protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/campaigns',
  '/templates',  // Added to ensure templates are protected
  '/contacts',   // Added to ensure contacts are protected
  '/groups',     // Added to ensure groups are protected
  '/settings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is a public route or static file
  if (
    publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }
  
  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isProtectedRoute) {
    // Check if the user is authenticated
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // If not authenticated, redirect to the home page
    if (!token) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - API routes that don't need authentication (like auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};