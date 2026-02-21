import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/register'];

const roleRoutes: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/instructor': ['INSTRUCTOR', 'ADMIN'],
  '/student': ['STUDENT', 'INSTRUCTOR', 'ADMIN'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Require auth for everything else
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};