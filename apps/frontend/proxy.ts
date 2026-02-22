import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('accessToken')?.value;

  // Public routes — allow through
  if (['/login', '/register'].includes(pathname)) {
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === '/') {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // No token → login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Decode role from JWT payload (no verify needed — just routing)
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    const role: string = payload.role;

    // /dashboard → role-specific page
    if (pathname === '/dashboard') {
      if (role === 'ADMIN')      return NextResponse.redirect(new URL('/admin', request.url));
      if (role === 'INSTRUCTOR') return NextResponse.redirect(new URL('/instructor', request.url));
      return NextResponse.redirect(new URL('/student', request.url));
    }

    // Block wrong roles
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/instructor') && !['INSTRUCTOR', 'ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};