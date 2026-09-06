import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const STATIC_FILE = /\.[^/]+$/; // matches any path ending in a file extension: .png, .js, .webmanifest, etc.

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (STATIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const isLoginPage = pathname === '/login';

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image).*)'],
};