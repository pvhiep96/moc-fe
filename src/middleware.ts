import { NextRequest, NextResponse } from 'next/server';

// This middleware is now simplified to not require authentication
export function middleware(request: NextRequest) {
  // Allow all routes without authentication checks
  return NextResponse.next();
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|ico)).*)',
  ],
}; 